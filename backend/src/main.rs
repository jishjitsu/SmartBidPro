#[macro_use]
extern crate rocket;

mod auth;
mod db;
mod models;
mod routes;

use rocket::http::Method;
use rocket_cors::{AllowedOrigins, AllowedHeaders, CorsOptions};

#[get("/")]
fn index() -> &'static str {
    "SmartBid-PRO API v1.0"
}

#[get("/health")]
fn health() -> &'static str {
    "OK"
}

#[launch]
async fn rocket() -> _ {
    dotenv::dotenv().ok();
    
    let database = db::init_db()
        .await
        .expect("Failed to connect to database");
    
    // Configure CORS
    let cors = CorsOptions::default()
        .allowed_origins(AllowedOrigins::all())
        .allowed_methods(
            vec![Method::Get, Method::Post, Method::Put, Method::Delete, Method::Options]
                .into_iter()
                .map(From::from)
                .collect(),
        )
        .allowed_headers(AllowedHeaders::some(&["Authorization", "Content-Type", "Accept"]))
        .allow_credentials(true)
        .to_cors()
        .expect("Error creating CORS fairing");
    
    rocket::build()
        .manage(database)
        .attach(cors)
        .mount("/", routes![index, health])
        .mount("/api/auth", routes![
            routes::auth::register,
            routes::auth::login,
        ])
        .mount("/api", routes![
            routes::auctions::get_auctions,
            routes::auctions::get_auction,
            routes::auctions::create_auction,
            routes::auctions::update_auction,
            routes::auctions::delete_auction,
        ])
}
