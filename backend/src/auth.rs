use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use rocket::http::Status;
use rocket::request::{FromRequest, Outcome, Request};
use std::env;
use crate::models::{Claims, UserRole};

pub fn create_jwt(user_id: &str, email: &str, role: &UserRole) -> Result<String, jsonwebtoken::errors::Error> {
    let secret = env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
    let expiration = chrono::Utc::now()
        .checked_add_signed(chrono::Duration::hours(24))
        .expect("valid timestamp")
        .timestamp();

    let claims = Claims {
        sub: user_id.to_owned(),
        email: email.to_owned(),
        role: role.clone(),
        exp: expiration as usize,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_ref()),
    )
}

pub fn verify_jwt(token: &str) -> Result<Claims, jsonwebtoken::errors::Error> {
    let secret = env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
    
    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_ref()),
        &Validation::default(),
    )?;

    Ok(token_data.claims)
}

// Rocket request guard for authenticated users
pub struct AuthenticatedUser {
    pub claims: Claims,
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for AuthenticatedUser {
    type Error = ();

    async fn from_request(request: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        let token = request
            .headers()
            .get_one("Authorization")
            .and_then(|header| header.strip_prefix("Bearer "));

        match token {
            Some(token) => match verify_jwt(token) {
                Ok(claims) => Outcome::Success(AuthenticatedUser { claims }),
                Err(_) => Outcome::Error((Status::Unauthorized, ())),
            },
            None => Outcome::Error((Status::Unauthorized, ())),
        }
    }
}

// Role-based guard
pub struct AdminUser {
    pub claims: Claims,
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for AdminUser {
    type Error = ();

    async fn from_request(request: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        let auth_user = request.guard::<AuthenticatedUser>().await;
        
        match auth_user {
            Outcome::Success(user) => {
                match user.claims.role {
                    UserRole::Admin => Outcome::Success(AdminUser { claims: user.claims }),
                    _ => Outcome::Error((Status::Forbidden, ())),
                }
            }
            Outcome::Error(e) => Outcome::Error(e),
            Outcome::Forward(f) => Outcome::Forward(f),
        }
    }
}
