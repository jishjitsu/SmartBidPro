package main

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

const privateCollection = "privateBidDetails"

type SmartBidContract struct {
	contractapi.Contract
}

type PrivateBidDetails struct {
	BidID                string                 `json:"bid_id"`
	TenderID             string                 `json:"tender_id"`
	VendorID             string                 `json:"vendor_id"`
	TechnicalSpecs       map[string]any         `json:"technical_specs,omitempty"`
	EvaluationScore      *int                   `json:"evaluation_score,omitempty"`
	EvaluatorNotes       string                 `json:"evaluator_notes,omitempty"`
	Attachments          []string               `json:"attachments,omitempty"`
	CreatedAtISO         string                 `json:"created_at"`
	UpdatedAtISO         string                 `json:"updated_at"`
	AdditionalAttributes map[string]any         `json:"additional_attributes,omitempty"`
}

func bidKey(bidID string) string {
	bidID = strings.TrimSpace(bidID)
	return fmt.Sprintf("bid:%s", bidID)
}

func nowISO() string {
	return time.Now().UTC().Format(time.RFC3339)
}

// UpsertPrivateBidDetails stores private bid details in a PDC.
// Access is governed by `collections_config.json` (memberOnlyRead/memberOnlyWrite).
func (c *SmartBidContract) UpsertPrivateBidDetails(ctx contractapi.TransactionContextInterface, detailsJSON string) error {
	if strings.TrimSpace(detailsJSON) == "" {
		return fmt.Errorf("detailsJSON is required")
	}

	var details PrivateBidDetails
	if err := json.Unmarshal([]byte(detailsJSON), &details); err != nil {
		return fmt.Errorf("invalid JSON: %w", err)
	}
	if strings.TrimSpace(details.BidID) == "" {
		return fmt.Errorf("bid_id is required")
	}
	if strings.TrimSpace(details.TenderID) == "" {
		return fmt.Errorf("tender_id is required")
	}
	if strings.TrimSpace(details.VendorID) == "" {
		return fmt.Errorf("vendor_id is required")
	}

	k := bidKey(details.BidID)

	existingBytes, err := ctx.GetStub().GetPrivateData(privateCollection, k)
	if err != nil {
		return fmt.Errorf("get private data failed: %w", err)
	}

	if len(existingBytes) == 0 {
		details.CreatedAtISO = nowISO()
	} else {
		var existing PrivateBidDetails
		_ = json.Unmarshal(existingBytes, &existing)
		if existing.CreatedAtISO != "" {
			details.CreatedAtISO = existing.CreatedAtISO
		} else {
			details.CreatedAtISO = nowISO()
		}
	}

	details.UpdatedAtISO = nowISO()

	out, err := json.Marshal(details)
	if err != nil {
		return fmt.Errorf("marshal failed: %w", err)
	}

	if err := ctx.GetStub().PutPrivateData(privateCollection, k, out); err != nil {
		return fmt.Errorf("put private data failed: %w", err)
	}
	return nil
}

// ReadPrivateBidDetails reads private bid details from PDC.
func (c *SmartBidContract) ReadPrivateBidDetails(ctx contractapi.TransactionContextInterface, bidID string) (string, error) {
	bidID = strings.TrimSpace(bidID)
	if bidID == "" {
		return "", fmt.Errorf("bidID is required")
	}

	k := bidKey(bidID)
	b, err := ctx.GetStub().GetPrivateData(privateCollection, k)
	if err != nil {
		return "", fmt.Errorf("get private data failed: %w", err)
	}
	if len(b) == 0 {
		return "", fmt.Errorf("not found")
	}
	return string(b), nil
}

// DeletePrivateBidDetails deletes a private bid details record.
func (c *SmartBidContract) DeletePrivateBidDetails(ctx contractapi.TransactionContextInterface, bidID string) error {
	bidID = strings.TrimSpace(bidID)
	if bidID == "" {
		return fmt.Errorf("bidID is required")
	}
	return ctx.GetStub().DelPrivateData(privateCollection, bidKey(bidID))
}

func main() {
	cc, err := contractapi.NewChaincode(&SmartBidContract{})
	if err != nil {
		panic(err)
	}
	if err := cc.Start(); err != nil {
		panic(err)
	}
}

