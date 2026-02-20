use mongodb::Database;
use rocket::serde::json::Json;
use rocket::{State, http::Status};
use crate::models::{Auction, CreateAuctionRequest, UpdateAuctionRequest};
use crate::auth::AuthenticatedUser;
use mongodb::bson::{self, doc, oid::ObjectId};
use chrono::Utc;
use futures::stream::TryStreamExt;

#[get("/auctions")]
pub async fn get_auctions(
    db: &State<Database>,
    _user: AuthenticatedUser,
) -> Result<Json<Vec<Auction>>, Status> {
    let collection = db.collection::<Auction>("auctions");
    
    let cursor = collection
        .find(doc! {})
        .await
        .map_err(|e| {
            eprintln!("Error finding auctions: {:?}", e);
            Status::InternalServerError
        })?;
    
    let auctions: Vec<Auction> = cursor
        .try_collect()
        .await
        .map_err(|e| {
            eprintln!("Error collecting auctions: {:?}", e);
            Status::InternalServerError
        })?;
    
    Ok(Json(auctions))
}

#[get("/auctions/<id>")]
pub async fn get_auction(
    db: &State<Database>,
    _user: AuthenticatedUser,
    id: String,
) -> Result<Json<Auction>, Status> {
    let collection = db.collection::<Auction>("auctions");
    
    let object_id = ObjectId::parse_str(&id)
        .map_err(|_| Status::BadRequest)?;
    
    let auction = collection
        .find_one(doc! { "_id": object_id })
        .await
        .map_err(|_| Status::InternalServerError)?
        .ok_or(Status::NotFound)?;
    
    Ok(Json(auction))
}

#[post("/auctions", data = "<auction_data>")]
pub async fn create_auction(
    db: &State<Database>,
    user: AuthenticatedUser,
    auction_data: Json<CreateAuctionRequest>,
) -> Result<Json<Auction>, Status> {
    let collection = db.collection::<Auction>("auctions");
    
    let new_auction = Auction {
        id: None, // Let MongoDB generate the ObjectId
        title: auction_data.title.clone(),
        description: auction_data.description.clone(),
        status: auction_data.status.clone(),
        created_by: user.claims.sub.clone(),
        start_date: auction_data.start_date,
        end_date: auction_data.end_date,
        minimum_bid: auction_data.minimum_bid,
        category: auction_data.category.clone(),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };
    
    let result = collection
        .insert_one(&new_auction)
        .await
        .map_err(|_| Status::InternalServerError)?;
    
    let inserted_id = result.inserted_id.as_object_id()
        .ok_or(Status::InternalServerError)?;
    
    let created_auction = Auction {
        id: Some(inserted_id),
        ..new_auction
    };
    
    Ok(Json(created_auction))
}

#[put("/auctions/<id>", data = "<auction_data>")]
pub async fn update_auction(
    db: &State<Database>,
    user: AuthenticatedUser,
    id: String,
    auction_data: Json<UpdateAuctionRequest>,
) -> Result<Json<Auction>, Status> {
    let collection = db.collection::<Auction>("auctions");
    
    let object_id = ObjectId::parse_str(&id)
        .map_err(|_| Status::BadRequest)?;
    
    // Check if auction exists and user is authorized
    let existing = collection
        .find_one(doc! { "_id": object_id })
        .await
        .map_err(|_| Status::InternalServerError)?
        .ok_or(Status::NotFound)?;
    
    // Only admin or creator can update
    if existing.created_by != user.claims.sub && !matches!(user.claims.role, crate::models::UserRole::Admin) {
        return Err(Status::Forbidden);
    }
    
    // Use update_one with $set to avoid _id immutability error
    let update_doc = doc! {
        "$set": {
            "title": &auction_data.title,
            "description": &auction_data.description,
            "status": bson::to_bson(&auction_data.status).unwrap(),
            "start_date": bson::to_bson(&auction_data.start_date).unwrap(),
            "end_date": bson::to_bson(&auction_data.end_date).unwrap(),
            "minimum_bid": auction_data.minimum_bid,
            "category": &auction_data.category,
            "updated_at": bson::to_bson(&Utc::now()).unwrap(),
        }
    };
    
    collection
        .update_one(doc! { "_id": object_id }, update_doc)
        .await
        .map_err(|e| {
            eprintln!("Error updating auction: {:?}", e);
            Status::InternalServerError
        })?;
    
    // Return the updated auction
    let updated_auction = collection
        .find_one(doc! { "_id": object_id })
        .await
        .map_err(|_| Status::InternalServerError)?
        .ok_or(Status::InternalServerError)?;
    
    Ok(Json(updated_auction))
}

#[delete("/auctions/<id>")]
pub async fn delete_auction(
    db: &State<Database>,
    user: AuthenticatedUser,
    id: String,
) -> Result<Status, Status> {
    let collection = db.collection::<Auction>("auctions");
    
    let object_id = ObjectId::parse_str(&id)
        .map_err(|_| Status::BadRequest)?;
    
    // Check if auction exists and user is authorized
    let existing = collection
        .find_one(doc! { "_id": object_id })
        .await
        .map_err(|_| Status::InternalServerError)?
        .ok_or(Status::NotFound)?;
    
    // Only admin or creator can delete
    if existing.created_by != user.claims.sub && !matches!(user.claims.role, crate::models::UserRole::Admin) {
        return Err(Status::Forbidden);
    }
    
    collection
        .delete_one(doc! { "_id": object_id })
        .await
        .map_err(|_| Status::InternalServerError)?;
    
    Ok(Status::NoContent)
}
