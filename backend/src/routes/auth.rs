use mongodb::Database;
use rocket::serde::json::Json;
use rocket::{State, http::Status};
use bcrypt::{hash, verify, DEFAULT_COST};
use crate::models::{LoginRequest, LoginResponse, User, UserInfo, UserRole};
use crate::auth::create_jwt;
use mongodb::bson::doc;

#[post("/register", data = "<user_data>")]
pub async fn register(
    db: &State<Database>,
    user_data: Json<User>,
) -> Result<Json<UserInfo>, Status> {
    let collection = db.collection::<User>("users");
    
    // Check if user already exists
    let existing_user = collection
        .find_one(doc! { "email": &user_data.email }, None)
        .await
        .map_err(|_| Status::InternalServerError)?;
    
    if existing_user.is_some() {
        return Err(Status::Conflict);
    }
    
    // Hash password
    let password_hash = hash(&user_data.password_hash, DEFAULT_COST)
        .map_err(|_| Status::InternalServerError)?;
    
    let new_user = User {
        id: Some(uuid::Uuid::new_v4().to_string()),
        email: user_data.email.clone(),
        password_hash,
        role: user_data.role.clone(),
        name: user_data.name.clone(),
        created_at: chrono::Utc::now(),
    };
    
    collection
        .insert_one(&new_user, None)
        .await
        .map_err(|_| Status::InternalServerError)?;
    
    Ok(Json(UserInfo {
        id: new_user.id.unwrap(),
        email: new_user.email,
        name: new_user.name,
        role: new_user.role,
    }))
}

#[post("/login", data = "<credentials>")]
pub async fn login(
    db: &State<Database>,
    credentials: Json<LoginRequest>,
) -> Result<Json<LoginResponse>, Status> {
    let collection = db.collection::<User>("users");
    
    let user = collection
        .find_one(doc! { "email": &credentials.email }, None)
        .await
        .map_err(|_| Status::InternalServerError)?
        .ok_or(Status::Unauthorized)?;
    
    // Verify password
    let valid = verify(&credentials.password, &user.password_hash)
        .map_err(|_| Status::InternalServerError)?;
    
    if !valid {
        return Err(Status::Unauthorized);
    }
    
    let user_id = user.id.clone().unwrap();
    let token = create_jwt(&user_id, &user.email, &user.role)
        .map_err(|_| Status::InternalServerError)?;
    
    Ok(Json(LoginResponse {
        token,
        user: UserInfo {
            id: user_id,
            email: user.email,
            name: user.name,
            role: user.role,
        },
    }))
}
