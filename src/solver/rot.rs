use crate::solver::CipherSolver;
use std::collections::HashSet;

fn rotate_char(c: char, shift: u8) -> char {
    if c.is_ascii_lowercase() {
        (((c as u8 - b'a' + shift) % 26) + b'a') as char
    } else if c.is_ascii_uppercase() {
        (((c as u8 - b'A' + shift) % 26) + b'A') as char
    } else {
        c
    }
}

pub struct RotSolver {
    pub wordset: HashSet<String>,
}

impl RotSolver {
    pub fn new(wordlist: Vec<String>) -> Self {
        RotSolver {
            wordset: HashSet::from_iter(wordlist),
        }
    }
}

impl CipherSolver for RotSolver {
    fn solve(&self, input: &str) -> Vec<String> {
        let input_str = input.to_string();
        let mut results = Vec::new();
        for shift in 1..26 {
            let candidate: String = input_str.chars().map(|c| rotate_char(c, shift)).collect();
            if self.wordset.contains(&candidate) {
                results.push(format!("{} +{}", candidate, shift));
            }
        }
        results
    }
}
