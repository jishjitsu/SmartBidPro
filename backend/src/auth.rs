use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use actix_web::{FromRequest, HttpRequest, dev::Payload, error::ErrorUnauthorized};
use futures::future::{Ready, ready};
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

// Actix request guard for authenticated users
pub struct AuthenticatedUser {
    pub claims: Claims,
}

impl FromRequest for AuthenticatedUser {
    type Error = actix_web::Error;
    type Future = Ready<Result<Self, Self::Error>>;

    fn from_request(request: &HttpRequest, _: &mut Payload) -> Self::Future {
        let token = request
            .headers()
            .get("Authorization")
            .and_then(|header| header.to_str().ok())
            .and_then(|header| header.strip_prefix("Bearer "));

        match token {
            Some(token) => match verify_jwt(token) {
                Ok(claims) => ready(Ok(AuthenticatedUser { claims })),
                Err(_) => ready(Err(ErrorUnauthorized("Unauthorized access"))),
            },
            None => ready(Err(ErrorUnauthorized("Unauthorized access"))),
        }
    }
}
