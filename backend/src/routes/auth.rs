use mongodb::Database;
use rocket::serde::json::Json;
use rocket::{State, http::Status};
use bcrypt::{hash, verify, DEFAULT_COST};
use crate::models::{LoginRequest, LoginResponse, User, UserInfo};
use crate::auth::create_jwt;
use mongodb::bson::doc;

#[post("/register", data = "<user_data>")]
pub async fn register(
    db: &State<Database>,
    user_data: Json<User>,
) -> Result<Json<UserInfo>, Status> {
    let collection = db.collection::<User>("users");
    
    println!("📝 Registering user: {} ({})", user_data.name, user_data.email);
    
    // Check if user already exists
    let existing_user = collection
        .find_one(doc! { "email": &user_data.email })
        .await
        .map_err(|e| {
            eprintln!("❌ Database error checking existing user: {:?}", e);
            Status::InternalServerError
        })?;
    
    if existing_user.is_some() {
        println!("⚠️  User already exists: {}", user_data.email);
        return Err(Status::Conflict);
    }
    
    // Hash password
    println!("🔐 Hashing password for {}", user_data.email);
    let password_hash = hash(&user_data.password_hash, DEFAULT_COST)
        .map_err(|e| {
            eprintln!("❌ Bcrypt error: {:?}", e);
            Status::InternalServerError
        })?;
    
    let new_user = User {
        id: None, // Let MongoDB generate the ObjectId
        email: user_data.email.clone(),
        password_hash,
        role: user_data.role.clone(),
        name: user_data.name.clone(),
        created_at: chrono::Utc::now(),
    };
    
    println!("💾 Inserting user into database: {}", user_data.email);
    let result = collection
        .insert_one(&new_user)
        .await
        .map_err(|e| {
            eprintln!("❌ MongoDB insert error: {:?}", e);
            Status::InternalServerError
        })?;
    
    println!("🔑 Extracting ObjectId for {}", user_data.email);
    let inserted_id = result.inserted_id.as_object_id()
        .ok_or_else(|| {
            eprintln!("❌ Failed to extract ObjectId from insert result");
            Status::InternalServerError
        })?;
    
    println!("✅ Successfully registered: {} ({})", new_user.name, new_user.email);
    
    Ok(Json(UserInfo {
        id: inserted_id.to_hex(),
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
        .find_one(doc! { "email": &credentials.email })
        .await
        .map_err(|_| Status::InternalServerError)?
        .ok_or(Status::Unauthorized)?;
    
    // Verify password
    let valid = verify(&credentials.password, &user.password_hash)
        .map_err(|_| Status::InternalServerError)?;
    
    if !valid {
        return Err(Status::Unauthorized);
    }
    
    let user_id = user.id.as_ref()
        .ok_or(Status::InternalServerError)?
        .to_hex();
    
    let token = create_jwt(&user_id, &user.email, &user.role)
        .map_err(|_| Status::InternalServerError)?;
    
    Ok(Json(LoginResponse {
        token,
        user: UserInfo::from_user(&user),
    }))
}
