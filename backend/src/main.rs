mod auth;
mod blockchain;
mod errors;
mod models;
mod routes;
mod state;

use std::sync::Arc;

use actix_cors::Cors;
use actix_web::{App, HttpResponse, HttpServer, middleware::Logger, web};
use blockchain::BlockchainClient;
use mongodb::Client;

async fn index() -> HttpResponse {
    HttpResponse::Ok().body("SmartBid-PRO API v1.0")
}

async fn health() -> HttpResponse {
    HttpResponse::Ok().body("OK")
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv::dotenv().ok();

    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

    let mongodb_uri = std::env::var("MONGODB_URI")
        .unwrap_or_else(|_| "mongodb://localhost:27017".to_string());
    let database_name = std::env::var("DATABASE_NAME")
        .unwrap_or_else(|_| "smartbidpro".to_string());
    let eth_rpc_url = std::env::var("ETH_RPC_URL")
        .unwrap_or_else(|_| "http://127.0.0.1:8545".to_string());

    let client = Client::with_uri_str(&mongodb_uri)
        .await
        .expect("Failed to connect to database");

    let blockchain = Arc::new(
        BlockchainClient::new(&eth_rpc_url)
            .await
            .expect("Failed to initialize blockchain client"),
    );

    let app_state = state::AppState {
        db: client.database(&database_name),
        blockchain,
    };

    HttpServer::new(move || {
        let cors = Cors::permissive();

        App::new()
            .app_data(web::Data::new(app_state.clone()))
            .wrap(Logger::default())
            .wrap(cors)
            .route("/", web::get().to(index))
            .route("/health", web::get().to(health))
            .service(
                web::scope("/api/auth")
                    .route("/register", web::post().to(routes::auth::register))
                    .route("/login", web::post().to(routes::auth::login)),
            )
            .service(
                web::scope("/api")
                    .route("/auctions", web::get().to(routes::auctions::get_auctions))
                    .route("/auctions/{id}", web::get().to(routes::auctions::get_auction))
                    .route("/auctions", web::post().to(routes::auctions::create_auction))
                    .route("/auctions/{id}", web::put().to(routes::auctions::update_auction))
                    .route("/auctions/{id}", web::delete().to(routes::auctions::delete_auction))
                    .route("/auctions/{id}/notarize", web::post().to(routes::auctions::notarize_auction))
                    .route("/tenders/{tender_id}/apply", web::post().to(routes::bids::apply_to_tender))
                    .route("/admin/tenders/{tender_id}/bids", web::get().to(routes::bids::get_tender_bids))
                    .route("/admin/bids/{bid_id}/award", web::post().to(routes::bids::award_bid))
                    .route("/vendor/bids", web::get().to(routes::bids::get_vendor_bids)),
            )
    })
    .bind(("0.0.0.0", 8000))?
    .run()
    .await
}
