use crate::auth::AuthenticatedUser;
use crate::models::{AuctionStatus, Bid, BidStatus, CreateBidRequest, UserRole};
use chrono::Utc;
use futures::stream::TryStreamExt;
use mongodb::bson::{self, doc, oid::ObjectId, Document};
use mongodb::Database;
use rocket::http::Status;
use rocket::serde::json::Json;
use rocket::State;

#[post("/tenders/<tender_id>/apply", format = "json", data = "<bid_data>")]
pub async fn apply_to_tender(
    tender_id: String,
    bid_data: Json<CreateBidRequest>,
    user: AuthenticatedUser,
    db: &State<Database>,
) -> Result<Json<Bid>, Status> {
    // Only vendors can apply
    if user.claims.role != UserRole::Vendor {
        return Err(Status::Forbidden);
    }

    // Validate tender_id is a valid ObjectId
    let tender_object_id = match ObjectId::parse_str(&tender_id) {
        Ok(id) => id,
        Err(_) => return Err(Status::BadRequest),
    };

    // Check if tender exists and is open
    let auctions = db.collection::<Document>("auctions");
    let tender = match auctions.find_one(doc! { "_id": tender_object_id }).await {
        Ok(Some(tender)) => tender,
        Ok(None) => return Err(Status::NotFound),
        Err(_) => return Err(Status::InternalServerError),
    };

    // Verify tender status is "open"
    match tender.get_str("status") {
        Ok(status) if status.eq_ignore_ascii_case("open") => {}
        _ => return Err(Status::BadRequest),
    }

    // Check for duplicate bid from this vendor
    let bids = db.collection::<Document>("bids");
    let existing_bid = bids
        .find_one(doc! {
            "tender_id": &tender_id,
            "vendor_id": &user.claims.sub
        })
        .await;

    if let Ok(Some(_)) = existing_bid {
        return Err(Status::Conflict); // 409 - Vendor already applied
    }

    // Get vendor info from user
    let users = db.collection::<Document>("users");
    let vendor = match users
        .find_one(doc! { "_id": ObjectId::parse_str(&user.claims.sub).unwrap() })
        .await
    {
        Ok(Some(vendor)) => vendor,
        Ok(None) => return Err(Status::NotFound),
        Err(_) => return Err(Status::InternalServerError),
    };

    let vendor_name = vendor.get_str("name").unwrap_or("Unknown").to_string();
    let vendor_company = vendor.get_str("company").unwrap_or("").to_string();

    // Create bid document
    let now = Utc::now();
    let bid = Bid {
        id: None,
        tender_id: tender_id.clone(),
        vendor_id: user.claims.sub.clone(),
        vendor_name,
        vendor_company,
        bid_amount: bid_data.bid_amount,
        proposal_text: bid_data.proposal_text.clone(),
        documents: bid_data.documents.clone(),
        compliance_analysis: bid_data.compliance_analysis.clone(),
        status: BidStatus::Applied,
        created_at: now,
        updated_at: now,
    };

    let bid_doc = match bson::to_document(&bid) {
        Ok(doc) => doc,
        Err(_) => return Err(Status::InternalServerError),
    };

    let bids_collection = db.collection::<Document>("bids");
    let result = bids_collection.insert_one(bid_doc).await;

    match result {
        Ok(insert_result) => {
            let inserted_id = insert_result.inserted_id.as_object_id().unwrap();
            let mut created_bid = bid;
            created_bid.id = Some(inserted_id);
            Ok(Json(created_bid))
        }
        Err(_) => Err(Status::InternalServerError),
    }
}

#[get("/admin/tenders/<tender_id>/bids")]
pub async fn get_tender_bids(
    tender_id: String,
    user: AuthenticatedUser,
    db: &State<Database>,
) -> Result<Json<Vec<Bid>>, Status> {
    // Only admins can view bids
    if user.claims.role != UserRole::Admin {
        return Err(Status::Forbidden);
    }

    let bids = db.collection::<Bid>("bids");

    let cursor = bids
        .find(doc! { "tender_id": &tender_id })
        .await
        .map_err(|_| Status::InternalServerError)?;

    let bids_vec: Vec<Bid> = cursor
        .try_collect()
        .await
        .map_err(|_| Status::InternalServerError)?;

    Ok(Json(bids_vec))
}

#[post("/admin/bids/<bid_id>/award")]
pub async fn award_bid(
    bid_id: String,
    user: AuthenticatedUser,
    db: &State<Database>,
) -> Result<Json<Bid>, Status> {
    // Only admins can award bids
    if user.claims.role != UserRole::Admin {
        return Err(Status::Forbidden);
    }

    // Validate bid_id is a valid ObjectId
    let bid_object_id = match ObjectId::parse_str(&bid_id) {
        Ok(id) => id,
        Err(_) => return Err(Status::BadRequest),
    };

    let bids = db.collection::<Bid>("bids");

    // Get the bid to be awarded
    let bid = match bids.find_one(doc! { "_id": bid_object_id }).await {
        Ok(Some(bid)) => bid,
        Ok(None) => return Err(Status::NotFound),
        Err(_) => return Err(Status::InternalServerError),
    };

    // Update this bid to Awarded
    let now = Utc::now();
    match bids
        .update_one(
            doc! { "_id": bid_object_id },
            doc! {
                "$set": {
                    "status": bson::to_bson(&BidStatus::Awarded).unwrap(),
                    "updated_at": bson::to_bson(&now).unwrap()
                }
            },
        )
        .await
    {
        Ok(_) => {}
        Err(_) => return Err(Status::InternalServerError),
    };

    // Reject all other bids for the same tender
    match bids
        .update_many(
            doc! {
                "tender_id": &bid.tender_id,
                "_id": { "$ne": bid_object_id }
            },
            doc! {
                "$set": {
                    "status": bson::to_bson(&BidStatus::Rejected).unwrap(),
                    "updated_at": bson::to_bson(&now).unwrap()
                }
            },
        )
        .await
    {
        Ok(_) => {}
        Err(_) => return Err(Status::InternalServerError),
    };

    // Update tender status to "awarded"
    let auctions = db.collection::<Document>("auctions");
    let tender_object_id = match ObjectId::parse_str(&bid.tender_id) {
        Ok(id) => id,
        Err(_) => return Err(Status::BadRequest),
    };

    match auctions
        .update_one(
            doc! { "_id": tender_object_id },
            doc! {
                "$set": {
                    "status": bson::to_bson(&AuctionStatus::Awarded).unwrap(),
                    "updated_at": bson::to_bson(&now).unwrap()
                }
            },
        )
        .await
    {
        Ok(_) => {}
        Err(_) => return Err(Status::InternalServerError),
    };

    // Return the updated awarded bid
    let awarded_bid = match bids.find_one(doc! { "_id": bid_object_id }).await {
        Ok(Some(bid)) => bid,
        Ok(None) => return Err(Status::NotFound),
        Err(_) => return Err(Status::InternalServerError),
    };

    Ok(Json(awarded_bid))
}

#[get("/vendor/bids")]
pub async fn get_vendor_bids(
    user: AuthenticatedUser,
    db: &State<Database>,
) -> Result<Json<Vec<Bid>>, Status> {
    // Only vendors can view their own bids
    if user.claims.role != UserRole::Vendor {
        return Err(Status::Forbidden);
    }

    let bids = db.collection::<Bid>("bids");

    let cursor = bids
        .find(doc! { "vendor_id": &user.claims.sub })
        .await
        .map_err(|_| Status::InternalServerError)?;

    let bids_vec: Vec<Bid> = cursor
        .try_collect()
        .await
        .map_err(|_| Status::InternalServerError)?;

    Ok(Json(bids_vec))
}
