use crate::auth::AuthenticatedUser;
use crate::errors::AppError;
use crate::models::{AuctionStatus, Bid, BidStatus, CreateBidRequest, UserRole};
use crate::state::AppState;
use actix_web::{HttpResponse, web};
use chrono::Utc;
use futures::stream::TryStreamExt;
use mongodb::bson::{self, doc, oid::ObjectId, Document};

pub async fn apply_to_tender(
    tender_id: web::Path<String>,
    bid_data: web::Json<CreateBidRequest>,
    user: AuthenticatedUser,
    state: web::Data<AppState>,
) -> Result<HttpResponse, AppError> {
    let tender_id = tender_id.into_inner();

    if user.claims.role != UserRole::Vendor {
        return Err(AppError::Forbidden);
    }

    let tender_object_id = match ObjectId::parse_str(&tender_id) {
        Ok(id) => id,
        Err(_) => return Err(AppError::BadRequest),
    };

    let auctions = state.db.collection::<Document>("auctions");
    let tender = match auctions.find_one(doc! { "_id": tender_object_id }).await {
        Ok(Some(tender)) => tender,
        Ok(None) => return Err(AppError::NotFound),
        Err(e) => return Err(AppError::DbError(e)),
    };

    match tender.get_str("status") {
        Ok(status) if status.eq_ignore_ascii_case("open") => {}
        _ => return Err(AppError::BadRequest),
    }

    let bids = state.db.collection::<Document>("bids");
    let existing_bid = bids
        .find_one(doc! {
            "tender_id": &tender_id,
            "vendor_id": &user.claims.sub
        })
        .await;

    if let Ok(Some(_)) = existing_bid {
        return Err(AppError::Conflict);
    }

    let users = state.db.collection::<Document>("users");
    let user_id = ObjectId::parse_str(&user.claims.sub).map_err(|_| AppError::BadRequest)?;
    let vendor = match users
        .find_one(doc! { "_id": user_id })
        .await
    {
        Ok(Some(vendor)) => vendor,
        Ok(None) => return Err(AppError::NotFound),
        Err(e) => return Err(AppError::DbError(e)),
    };

    let vendor_name = vendor.get_str("name").unwrap_or("Unknown").to_string();
    let vendor_company = vendor.get_str("company").unwrap_or("").to_string();

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
        Err(_) => return Err(AppError::InternalError),
    };

    let bids_collection = state.db.collection::<Document>("bids");
    let result = bids_collection.insert_one(bid_doc).await;

    match result {
        Ok(insert_result) => {
            let inserted_id = insert_result
                .inserted_id
                .as_object_id()
                .ok_or(AppError::InternalError)?;
            let mut created_bid = bid;
            created_bid.id = Some(inserted_id);
            Ok(HttpResponse::Created().json(created_bid))
        }
        Err(e) => Err(AppError::DbError(e)),
    }
}

pub async fn get_tender_bids(
    tender_id: web::Path<String>,
    user: AuthenticatedUser,
    state: web::Data<AppState>,
) -> Result<HttpResponse, AppError> {
    let tender_id = tender_id.into_inner();

    if user.claims.role != UserRole::Admin {
        return Err(AppError::Forbidden);
    }

    let bids = state.db.collection::<Bid>("bids");

    let cursor = bids
        .find(doc! { "tender_id": &tender_id })
        .await
        .map_err(AppError::DbError)?;

    let bids_vec: Vec<Bid> = cursor
        .try_collect()
        .await
        .map_err(|_| AppError::InternalError)?;

    Ok(HttpResponse::Ok().json(bids_vec))
}

pub async fn award_bid(
    bid_id: web::Path<String>,
    user: AuthenticatedUser,
    state: web::Data<AppState>,
) -> Result<HttpResponse, AppError> {
    let bid_id = bid_id.into_inner();

    if user.claims.role != UserRole::Admin {
        return Err(AppError::Forbidden);
    }

    let bid_object_id = match ObjectId::parse_str(&bid_id) {
        Ok(id) => id,
        Err(_) => return Err(AppError::BadRequest),
    };

    let bids = state.db.collection::<Bid>("bids");

    let bid = match bids.find_one(doc! { "_id": bid_object_id }).await {
        Ok(Some(bid)) => bid,
        Ok(None) => return Err(AppError::NotFound),
        Err(e) => return Err(AppError::DbError(e)),
    };

    let now = Utc::now();
    match bids
        .update_one(
            doc! { "_id": bid_object_id },
            doc! {
                "$set": {
                    "status": bson::to_bson(&BidStatus::Awarded).map_err(|_| AppError::InternalError)?,
                    "updated_at": bson::to_bson(&now).map_err(|_| AppError::InternalError)?
                }
            },
        )
        .await
    {
        Ok(_) => {}
        Err(e) => return Err(AppError::DbError(e)),
    };

    match bids
        .update_many(
            doc! {
                "tender_id": &bid.tender_id,
                "_id": { "$ne": bid_object_id }
            },
            doc! {
                "$set": {
                    "status": bson::to_bson(&BidStatus::Rejected).map_err(|_| AppError::InternalError)?,
                    "updated_at": bson::to_bson(&now).map_err(|_| AppError::InternalError)?
                }
            },
        )
        .await
    {
        Ok(_) => {}
        Err(e) => return Err(AppError::DbError(e)),
    };

    let auctions = state.db.collection::<Document>("auctions");
    let tender_object_id = match ObjectId::parse_str(&bid.tender_id) {
        Ok(id) => id,
        Err(_) => return Err(AppError::BadRequest),
    };

    match auctions
        .update_one(
            doc! { "_id": tender_object_id },
            doc! {
                "$set": {
                    "status": bson::to_bson(&AuctionStatus::Awarded).map_err(|_| AppError::InternalError)?,
                    "updated_at": bson::to_bson(&now).map_err(|_| AppError::InternalError)?
                }
            },
        )
        .await
    {
        Ok(_) => {}
        Err(e) => return Err(AppError::DbError(e)),
    };

    let awarded_bid = match bids.find_one(doc! { "_id": bid_object_id }).await {
        Ok(Some(bid)) => bid,
        Ok(None) => return Err(AppError::NotFound),
        Err(e) => return Err(AppError::DbError(e)),
    };

    Ok(HttpResponse::Ok().json(awarded_bid))
}

pub async fn get_vendor_bids(
    user: AuthenticatedUser,
    state: web::Data<AppState>,
) -> Result<HttpResponse, AppError> {
    if user.claims.role != UserRole::Vendor {
        return Err(AppError::Forbidden);
    }

    let bids = state.db.collection::<Bid>("bids");

    let cursor = bids
        .find(doc! { "vendor_id": &user.claims.sub })
        .await
        .map_err(AppError::DbError)?;

    let bids_vec: Vec<Bid> = cursor
        .try_collect()
        .await
        .map_err(|_| AppError::InternalError)?;

    Ok(HttpResponse::Ok().json(bids_vec))
}
