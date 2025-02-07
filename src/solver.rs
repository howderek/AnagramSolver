pub mod anagram;
pub mod rot;

/// A solver for a “cipher” that turns an input string into candidate outputs.
pub trait CipherSolver {
    fn solve(&self, input: &str) -> Vec<String>;
}
