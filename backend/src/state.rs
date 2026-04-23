use std::sync::Arc;

use crate::blockchain::BlockchainClient;
use mongodb::Database;

#[derive(Clone)]
pub struct AppState {
    pub db: Database,
    pub blockchain: Arc<BlockchainClient>,
}
