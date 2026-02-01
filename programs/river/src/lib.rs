use anchor_lang::prelude::*;

declare_id!("HaUJ1uQtgZi8x822pkGFNtVHXaFbGKd2JKGBRS4q5ZvR");

// Seeds for PDA derivation
pub const NEGOTIATION_SEED: &[u8] = b"negotiation";

// MagicBlock TEE Validator for Private Ephemeral Rollups (devnet)
// Transactions to this validator are processed in Intel TDX secure enclave
pub const TEE_VALIDATOR: &str = "FnE6VJT5QNZdedZPnCoLsARgBwoE6DeJNjBs2H1gySXA";
pub const TEE_ENDPOINT: &str = "https://tee.magicblock.app";

#[program]
pub mod river {
    use super::*;

    /// Create a new negotiation session on Solana L1
    /// Called by the employer before delegation to TEE
    pub fn create_negotiation(ctx: Context<CreateNegotiation>, negotiation_id: u64) -> Result<()> {
        let negotiation = &mut ctx.accounts.negotiation;
        
        negotiation.id = negotiation_id;
        negotiation.employer = ctx.accounts.employer.key();
        negotiation.candidate = None;
        
        // Initialize as None
        negotiation.employer_base = None;
        negotiation.employer_bonus = None;
        negotiation.employer_equity = None;
        
        negotiation.candidate_base = None;
        negotiation.candidate_bonus = None;
        negotiation.candidate_equity = None;
        
        negotiation.status = NegotiationStatus::Created;
        negotiation.result = MatchResult::Pending;
        negotiation.match_details = None;
        
        msg!("Negotiation {} created by employer {}", negotiation_id, negotiation.employer);
        Ok(())
    }

    /// Candidate joins the negotiation on Solana L1
    pub fn join_negotiation(ctx: Context<JoinNegotiation>) -> Result<()> {
        let negotiation = &mut ctx.accounts.negotiation;
        
        require!(negotiation.candidate.is_none(), RiverError::NegotiationFull);
        require!(
            negotiation.employer != ctx.accounts.candidate.key(),
            RiverError::CannotJoinOwnNegotiation
        );
        
        negotiation.candidate = Some(ctx.accounts.candidate.key());
        negotiation.status = NegotiationStatus::Ready;
        
        msg!("Candidate {} joined negotiation {}", ctx.accounts.candidate.key(), negotiation.id);
        Ok(())
    }

    /// Submit employer's budget breakdown
    /// When called via TEE endpoint, the values are encrypted in transit and memory
    pub fn submit_employer_budget(
        ctx: Context<SubmitBudget>,
        base: u64,
        bonus: u64,
        equity: u64,
    ) -> Result<()> {
        let negotiation = &mut ctx.accounts.negotiation;
        
        require!(
            negotiation.employer == ctx.accounts.employer.key(),
            RiverError::Unauthorized
        );
        require!(
            negotiation.employer_base.is_none(), // Check one field is enough
            RiverError::AlreadySubmitted
        );
        
        // Store the budget components - only visible inside TEE when called via TEE endpoint
        negotiation.employer_base = Some(base);
        negotiation.employer_bonus = Some(bonus);
        negotiation.employer_equity = Some(equity);
        
        // Check if we can determine result
        check_and_update_result(negotiation)?;
        
        msg!("Employer submitted budget for negotiation {}", negotiation.id);
        Ok(())
    }

    /// Submit candidate's minimum requirement breakdown
    /// When called via TEE endpoint, the values are encrypted in transit and memory
    pub fn submit_candidate_requirement(
        ctx: Context<SubmitRequirement>,
        base: u64,
        bonus: u64,
        equity: u64,
    ) -> Result<()> {
        let negotiation = &mut ctx.accounts.negotiation;
        
        require!(
            negotiation.candidate == Some(ctx.accounts.candidate.key()),
            RiverError::Unauthorized
        );
        require!(
            negotiation.candidate_base.is_none(), // Check one field is enough
            RiverError::AlreadySubmitted
        );
        
        // Store the requirement components - only visible inside TEE when called via TEE endpoint
        negotiation.candidate_base = Some(base);
        negotiation.candidate_bonus = Some(bonus);
        negotiation.candidate_equity = Some(equity);
        
        // Check if we can determine result
        check_and_update_result(negotiation)?;
        
        msg!("Candidate submitted requirement for negotiation {}", negotiation.id);
        Ok(())
    }

    /// Finalize the negotiation - clear salary values, keep only result
    /// Called to commit final result back to L1
    pub fn finalize_negotiation(ctx: Context<FinalizeNegotiation>) -> Result<()> {
        let negotiation = &mut ctx.accounts.negotiation;
        
        require!(
            negotiation.status == NegotiationStatus::Complete,
            RiverError::NotComplete
        );
        
        // Clear the actual salary values before committing to L1
        // Only the result (Match/NoMatch + Details) is persisted on-chain
        negotiation.employer_base = None;
        negotiation.employer_bonus = None;
        negotiation.employer_equity = None;
        
        negotiation.candidate_base = None;
        negotiation.candidate_bonus = None;
        negotiation.candidate_equity = None;
        
        negotiation.status = NegotiationStatus::Finalized;
        
        msg!(
            "Negotiation {} finalized with result: {:?}",
            negotiation.id,
            negotiation.result
        );
        Ok(())
    }
}

/// Check if both parties have submitted and determine the result
fn check_and_update_result(negotiation: &mut Account<Negotiation>) -> Result<()> {
    if let (
        Some(emp_base), Some(emp_bonus), Some(emp_equity),
        Some(cand_base), Some(cand_bonus), Some(cand_equity)
    ) = (
        negotiation.employer_base, negotiation.employer_bonus, negotiation.employer_equity,
        negotiation.candidate_base, negotiation.candidate_bonus, negotiation.candidate_equity
    ) {
        // Calculate totals
        let emp_total = emp_base.saturating_add(emp_bonus).saturating_add(emp_equity);
        let cand_total = cand_base.saturating_add(cand_bonus).saturating_add(cand_equity);

        // Core comparison logic
        let base_match = cand_base <= emp_base;
        let bonus_match = cand_bonus <= emp_bonus;
        let equity_match = cand_equity <= emp_equity;
        // Total match is the most important for overall "Deal / No Deal" usually,
        // but traditionally means the entire package fits.
        // We will define "Total Match" as: Cand Total <= Emp Total.
        let total_match = cand_total <= emp_total;

        // Populate details
        negotiation.match_details = Some(MatchDetails {
            base_match,
            bonus_match,
            equity_match,
            total_match,
        });

        // Determine overall outcome: Is it a match?
        // Basic rule: If Total matches, it's a "Match".
        // Or should we require ALL components?
        // Usually in negotiation, if the total value is okay, it's a starting point,
        // but the user asked for granular "what matched what doesn't".
        // Let's set overall result based on Total Match for simplicity of "Yes/No",
        // but the details will show the breakdown.
        if total_match {
            negotiation.result = MatchResult::Match;
        } else {
            negotiation.result = MatchResult::NoMatch;
        }

        negotiation.status = NegotiationStatus::Complete;
        
        msg!(
            "Negotiation complete: Result={:?}, Details={:?}",
            negotiation.result,
            negotiation.match_details
        );
    }
    Ok(())
}

// ============== Account Contexts ==============

#[derive(Accounts)]
#[instruction(negotiation_id: u64)]
pub struct CreateNegotiation<'info> {
    #[account(
        init,
        payer = employer,
        space = 8 + Negotiation::LEN,
        seeds = [NEGOTIATION_SEED, &negotiation_id.to_le_bytes()],
        bump
    )]
    pub negotiation: Account<'info, Negotiation>,
    
    #[account(mut)]
    pub employer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinNegotiation<'info> {
    #[account(
        mut,
        seeds = [NEGOTIATION_SEED, &negotiation.id.to_le_bytes()],
        bump
    )]
    pub negotiation: Account<'info, Negotiation>,
    
    #[account(mut)]
    pub candidate: Signer<'info>,
}

#[derive(Accounts)]
pub struct SubmitBudget<'info> {
    #[account(
        mut,
        seeds = [NEGOTIATION_SEED, &negotiation.id.to_le_bytes()],
        bump
    )]
    pub negotiation: Account<'info, Negotiation>,
    
    pub employer: Signer<'info>,
}

#[derive(Accounts)]
pub struct SubmitRequirement<'info> {
    #[account(
        mut,
        seeds = [NEGOTIATION_SEED, &negotiation.id.to_le_bytes()],
        bump
    )]
    pub negotiation: Account<'info, Negotiation>,
    
    pub candidate: Signer<'info>,
}

#[derive(Accounts)]
pub struct FinalizeNegotiation<'info> {
    #[account(
        mut,
        seeds = [NEGOTIATION_SEED, &negotiation.id.to_le_bytes()],
        bump
    )]
    pub negotiation: Account<'info, Negotiation>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
}

// ============== Account Structs ==============

#[account]
pub struct Negotiation {
    pub id: u64,
    pub employer: Pubkey,
    pub candidate: Option<Pubkey>,
    
    // Employer components (Cleared before L1 commit)
    pub employer_base: Option<u64>,
    pub employer_bonus: Option<u64>,
    pub employer_equity: Option<u64>,
    
    // Candidate components (Cleared before L1 commit)
    pub candidate_base: Option<u64>,
    pub candidate_bonus: Option<u64>,
    pub candidate_equity: Option<u64>,
    
    pub status: NegotiationStatus,
    pub result: MatchResult,
    pub match_details: Option<MatchDetails>, // Granular results
}

impl Negotiation {
    pub const LEN: usize = 
        8 +                    // id
        32 +                   // employer
        (1 + 32) +             // candidate (Option<Pubkey>)
        // Employer components
        (1 + 8) +              // employer_base (Option<u64>)
        (1 + 8) +              // employer_bonus
        (1 + 8) +              // employer_equity
        // Candidate components
        (1 + 8) +              // candidate_base (Option<u64>)
        (1 + 8) +              // candidate_bonus
        (1 + 8) +              // candidate_equity
        1 +                    // status
        1 +                    // result
        (1 + MatchDetails::LEN); // match_details (Option<MatchDetails>)
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub struct MatchDetails {
    pub base_match: bool,
    pub bonus_match: bool,
    pub equity_match: bool,
    pub total_match: bool,
}

impl MatchDetails {
    pub const LEN: usize = 1 + 1 + 1 + 1; // 4 bools
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum NegotiationStatus {
    Created,
    Ready,
    EmployerSubmitted,
    CandidateSubmitted,
    Complete,
    Finalized,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum MatchResult {
    Pending,
    Match,
    NoMatch,
}

// ============== Errors ==============

#[error_code]
pub enum RiverError {
    #[msg("Negotiation is already full")]
    NegotiationFull,
    
    #[msg("Cannot join your own negotiation")]
    CannotJoinOwnNegotiation,
    
    #[msg("Unauthorized")]
    Unauthorized,
    
    #[msg("Already submitted")]
    AlreadySubmitted,
    
    #[msg("Negotiation not complete")]
    NotComplete,
}
