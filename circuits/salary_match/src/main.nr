// Double-Blind Salary Negotiation Circuit
// 
// This circuit proves that a candidate's minimum salary requirement
// is less than or equal to an employer's maximum budget, WITHOUT
// revealing the actual numbers to either party.
//
// Private Inputs:
//   - employer_max: The maximum salary the employer is willing to pay
//   - candidate_min: The minimum salary the candidate will accept
//
// Public Output:
//   - is_match: 1 if candidate_min <= employer_max, 0 otherwise

fn main(
    // Private inputs - these are never revealed
    employer_max: u64,
    candidate_min: u64
) -> pub Field {
    // Check if there's an overlap in salary expectations
    // A match exists when the candidate's minimum is <= employer's maximum
    let is_match = candidate_min <= employer_max;
    
    // Convert boolean to Field (1 for match, 0 for no match)
    // This becomes the public output that anyone can see
    if is_match {
        1
    } else {
        0
    }
}

// Tests to verify the circuit logic
#[test]
fn test_match_found() {
    // Employer willing to pay up to 100k, candidate wants at least 80k
    // Should match since 80k <= 100k
    let result = main(100000, 80000);
    assert(result == 1);
}

#[test]
fn test_exact_match() {
    // Employer willing to pay up to 90k, candidate wants exactly 90k
    // Should match since 90k <= 90k
    let result = main(90000, 90000);
    assert(result == 1);
}

#[test]
fn test_no_match() {
    // Employer willing to pay up to 70k, candidate wants at least 80k
    // Should NOT match since 80k > 70k
    let result = main(70000, 80000);
    assert(result == 0);
}

#[test]
fn test_large_gap_match() {
    // Employer has large budget (200k), candidate has low requirement (50k)
    // Should match since 50k <= 200k
    let result = main(200000, 50000);
    assert(result == 1);
}

#[test]
fn test_edge_case_zero() {
    // Edge case: both values are 0
    let result = main(0, 0);
    assert(result == 1);
}
