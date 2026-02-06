use mongodb::Database;
use rocket::serde::json::Json;
use rocket::{State, http::Status};
use crate::models::Auction;
use crate::auth::AuthenticatedUser;
use mongodb::bson::doc;
use chrono::Utc;

#[get("/auctions")]
pub async fn get_auctions(
    db: &State<Database>,
    _user: AuthenticatedUser,
) -> Result<Json<Vec<Auction>>, Status> {
    let collection = db.collection::<Auction>("auctions");
    
    let mut cursor = collection
        .find(doc! {})
        .await
        .map_err(|_| Status::InternalServerError)?;
    
    let mut auctions = Vec::new();
    while cursor.advance().await.map_err(|_| Status::InternalServerError)? {
        let auction = cursor.deserialize_current()
            .map_err(|_| Status::InternalServerError)?;
        auctions.push(auction);
    }
    
    Ok(Json(auctions))
}

#[get("/auctions/<id>")]
pub async fn get_auction(
    db: &State<Database>,
    _user: AuthenticatedUser,
    id: String,
) -> Result<Json<Auction>, Status> {
    let collection = db.collection::<Auction>("auctions");
    
    let auction = collection
        .find_one(doc! { "_id": &id })
        .await
        .map_err(|_| Status::InternalServerError)?
        .ok_or(Status::NotFound)?;
    
    Ok(Json(auction))
}

#[post("/auctions", data = "<auction_data>")]
pub async fn create_auction(
    db: &State<Database>,
    user: AuthenticatedUser,
    auction_data: Json<Auction>,
) -> Result<Json<Auction>, Status> {
    let collection = db.collection::<Auction>("auctions");
    
    let new_auction = Auction {
        id: Some(uuid::Uuid::new_v4().to_string()),
        title: auction_data.title.clone(),
        description: auction_data.description.clone(),
        status: auction_data.status.clone(),
        created_by: user.claims.sub.clone(),
        start_date: auction_data.start_date,
        end_date: auction_data.end_date,
        minimum_bid: auction_data.minimum_bid,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };
    
    collection
        .insert_one(&new_auction)
        .await
        .map_err(|_| Status::InternalServerError)?;
    
    Ok(Json(new_auction))
}

#[put("/auctions/<id>", data = "<auction_data>")]
pub async fn update_auction(
    db: &State<Database>,
    user: AuthenticatedUser,
    id: String,
    auction_data: Json<Auction>,
) -> Result<Json<Auction>, Status> {
    let collection = db.collection::<Auction>("auctions");
    
    // Check if auction exists and user is authorized
    let existing = collection
        .find_one(doc! { "_id": &id })
        .await
        .map_err(|_| Status::InternalServerError)?
        .ok_or(Status::NotFound)?;
    
    // Only admin or creator can update
    if existing.created_by != user.claims.sub && !matches!(user.claims.role, crate::models::UserRole::Admin) {
        return Err(Status::Forbidden);
    }
    
    let updated_auction = Auction {
        id: Some(id.clone()),
        title: auction_data.title.clone(),
        description: auction_data.description.clone(),
        status: auction_data.status.clone(),
        created_by: existing.created_by,
        start_date: auction_data.start_date,
        end_date: auction_data.end_date,
        minimum_bid: auction_data.minimum_bid,
        created_at: existing.created_at,
        updated_at: Utc::now(),
    };
    
    collection
        .replace_one(doc! { "_id": &id }, &updated_auction)
        .await
        .map_err(|_| Status::InternalServerError)?;
    
    Ok(Json(updated_auction))
}

#[delete("/auctions/<id>")]
pub async fn delete_auction(
    db: &State<Database>,
    user: AuthenticatedUser,
    id: String,
) -> Result<Status, Status> {
    let collection = db.collection::<Auction>("auctions");
    
    // Check if auction exists and user is authorized
    let existing = collection
        .find_one(doc! { "_id": &id })
        .await
        .map_err(|_| Status::InternalServerError)?
        .ok_or(Status::NotFound)?;
    
    // Only admin or creator can delete
    if existing.created_by != user.claims.sub && !matches!(user.claims.role, crate::models::UserRole::Admin) {
        return Err(Status::Forbidden);
    }
    
    collection
        .delete_one(doc! { "_id": &id })
        .await
        .map_err(|_| Status::InternalServerError)?;
    
    Ok(Status::NoContent)
}
