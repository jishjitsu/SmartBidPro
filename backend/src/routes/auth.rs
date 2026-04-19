use actix_web::{HttpResponse, web};
use bcrypt::{hash, verify, DEFAULT_COST};
use crate::models::{LoginRequest, LoginResponse, User, UserInfo};
use crate::auth::create_jwt;
use crate::errors::AppError;
use crate::state::AppState;
use mongodb::bson::doc;

pub async fn register(
    state: web::Data<AppState>,
    user_data: web::Json<User>,
) -> Result<HttpResponse, AppError> {
    let collection = state.db.collection::<User>("users");

    let existing_user = collection
        .find_one(doc! { "email": &user_data.email })
        .await?;

    if existing_user.is_some() {
        return Err(AppError::Conflict);
    }

    let password_hash = hash(&user_data.password_hash, DEFAULT_COST)
        .map_err(|_| AppError::InternalError)?;

    let new_user = User {
        id: None,
        email: user_data.email.clone(),
        password_hash,
        role: user_data.role.clone(),
        name: user_data.name.clone(),
        created_at: chrono::Utc::now(),
    };

    let result = collection.insert_one(&new_user).await?;

    let inserted_id = result
        .inserted_id
        .as_object_id()
        .ok_or(AppError::InternalError)?;

    Ok(HttpResponse::Created().json(UserInfo {
        id: inserted_id.to_hex(),
        email: new_user.email,
        name: new_user.name,
        role: new_user.role,
    }))
}

pub async fn login(
    state: web::Data<AppState>,
    credentials: web::Json<LoginRequest>,
) -> Result<HttpResponse, AppError> {
    let collection = state.db.collection::<User>("users");

    let user = collection
        .find_one(doc! { "email": &credentials.email })
        .await
        .map_err(AppError::DbError)?
        .ok_or(AppError::Unauthorized)?;

    let valid = verify(&credentials.password, &user.password_hash)
        .map_err(|_| AppError::InternalError)?;

    if !valid {
        return Err(AppError::Unauthorized);
    }

    let user_id = user
        .id
        .as_ref()
        .ok_or(AppError::InternalError)?
        .to_hex();

    let token = create_jwt(&user_id, &user.email, &user.role)
        .map_err(|_| AppError::InternalError)?;

    Ok(HttpResponse::Ok().json(LoginResponse {
        token,
        user: UserInfo::from_user(&user),
    }))
}
