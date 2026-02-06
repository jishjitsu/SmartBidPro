use mongodb::{Client, Database};
use std::env;

pub async fn init_db() -> Result<Database, mongodb::error::Error> {
    let mongodb_uri = env::var("MONGODB_URI").unwrap_or_else(|_| "mongodb://localhost:27017".to_string());
    let database_name = env::var("DATABASE_NAME").unwrap_or_else(|_| "smartbidpro".to_string());
    
    let client = Client::with_uri_str(&mongodb_uri).await?;
    let database = client.database(&database_name);
    
    println!("✅ Connected to MongoDB database: {}", database_name);
    
    Ok(database)
}
