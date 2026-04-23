use std::str::FromStr;

use alloy::{
    network::EthereumWallet,
    primitives::{Address, B256, TxHash},
    providers::{DynProvider, Provider, ProviderBuilder},
    signers::local::PrivateKeySigner,
    sol,
};
use alloy::transports::http::reqwest::Url;

sol!(
    #[sol(rpc)]
    TenderNotary,
    "../contracts/out/TenderNotary.sol/TenderNotary.json"
);

#[derive(Clone)]
pub struct BlockchainClient {
    provider: DynProvider,
    notary_address: Address,
}

impl BlockchainClient {
    pub async fn new(rpc_url: &str) -> anyhow::Result<Self> {
        let signer: PrivateKeySigner = std::env::var("ETH_PRIVATE_KEY")?.parse()?;
        let wallet = EthereumWallet::from(signer);

        let provider = ProviderBuilder::default()
            .with_recommended_fillers()
            .wallet(wallet)
            .connect_http(Url::parse(rpc_url)?)
            .erased();

        let notary_address = Address::from_str(
            &std::env::var("ETH_NOTARY_CONTRACT_ADDRESS")
                .unwrap_or_else(|_| "0x0000000000000000000000000000000000000000".to_string()),
        )?;

        Ok(Self {
            provider,
            notary_address,
        })
    }

    pub async fn notarize_hash(&self, data_hash: B256) -> anyhow::Result<TxHash> {
        let contract = TenderNotary::new(self.notary_address, self.provider.clone());
        let call = contract.anchorHash(data_hash);

        println!("[notary] sending anchorHash tx for hash: {data_hash}");
        let pending_tx = call.send().await?;
        println!("[notary] tx broadcasted: {}", pending_tx.tx_hash());

        let receipt = pending_tx.get_receipt().await?;
        println!(
            "[notary] tx confirmed in block: {:?}, tx: {}",
            receipt.block_number,
            receipt.transaction_hash
        );

        Ok(receipt.transaction_hash)
    }
}
