pub mod solver;

pub use solver::anagram::AnagramSolver;
pub use solver::rot::RotSolver;
pub use solver::CipherSolver;

/// A default dictionary of candidate words.
pub const DEFAULT_WORDLIST: &str = include_str!("../assets/wordlist.txt");
