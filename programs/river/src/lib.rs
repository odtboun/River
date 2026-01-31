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
        negotiation.employer_max = None;
        negotiation.candidate_min = None;
        negotiation.status = NegotiationStatus::Created;
        negotiation.result = MatchResult::Pending;
        
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

    /// Submit employer's maximum budget
    /// When called via TEE endpoint, the value is encrypted in transit and memory
    pub fn submit_employer_budget(
        ctx: Context<SubmitBudget>,
        max_budget: u64,
    ) -> Result<()> {
        let negotiation = &mut ctx.accounts.negotiation;
        
        require!(
            negotiation.employer == ctx.accounts.employer.key(),
            RiverError::Unauthorized
        );
        require!(
            negotiation.employer_max.is_none(),
            RiverError::AlreadySubmitted
        );
        
        // Store the budget - only visible inside TEE when called via TEE endpoint
        negotiation.employer_max = Some(max_budget);
        
        // Check if we can determine result
        check_and_update_result(negotiation)?;
        
        msg!("Employer submitted budget for negotiation {}", negotiation.id);
        Ok(())
    }

    /// Submit candidate's minimum salary requirement
    /// When called via TEE endpoint, the value is encrypted in transit and memory
    pub fn submit_candidate_requirement(
        ctx: Context<SubmitRequirement>,
        min_salary: u64,
    ) -> Result<()> {
        let negotiation = &mut ctx.accounts.negotiation;
        
        require!(
            negotiation.candidate == Some(ctx.accounts.candidate.key()),
            RiverError::Unauthorized
        );
        require!(
            negotiation.candidate_min.is_none(),
            RiverError::AlreadySubmitted
        );
        
        // Store the requirement - only visible inside TEE when called via TEE endpoint
        negotiation.candidate_min = Some(min_salary);
        
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
        // Only the result (Match/NoMatch) is persisted on-chain
        negotiation.employer_max = None;
        negotiation.candidate_min = None;
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
    if let (Some(employer_max), Some(candidate_min)) = 
        (negotiation.employer_max, negotiation.candidate_min) 
    {
        // The core comparison - done inside the TEE
        // Neither party can see the other's value
        if candidate_min <= employer_max {
            negotiation.result = MatchResult::Match;
        } else {
            negotiation.result = MatchResult::NoMatch;
        }
        negotiation.status = NegotiationStatus::Complete;
        
        msg!(
            "Negotiation complete: {:?}",
            negotiation.result
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
    pub employer_max: Option<u64>,      // Cleared before L1 commit
    pub candidate_min: Option<u64>,     // Cleared before L1 commit
    pub status: NegotiationStatus,
    pub result: MatchResult,
}

impl Negotiation {
    pub const LEN: usize = 
        8 +                    // id
        32 +                   // employer
        (1 + 32) +            // candidate (Option<Pubkey>)
        (1 + 8) +             // employer_max (Option<u64>)
        (1 + 8) +             // candidate_min (Option<u64>)
        1 +                    // status
        1;                     // result
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
