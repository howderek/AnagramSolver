// Helper type wrapping an array of 26 letter counts (for letters a–z).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
struct LetterFreq([u8; 26]);

impl LetterFreq {
    /// Build a letter frequency from a string.
    ///
    /// This version iterates over bytes rather than chars,
    /// avoiding Unicode overhead when only ASCII letters matter.
    #[inline(always)]
    fn from_str(s: &str) -> Self {
        let mut freq = [0u8; 26];
        for &b in s.as_bytes() {
            if b'A' <= b && b <= b'Z' {
                freq[(b - b'A') as usize] += 1;
            } else if b'a' <= b && b <= b'z' {
                freq[(b - b'a') as usize] += 1;
            }
        }
        LetterFreq(freq)
    }

    /// Check whether no letters are left.
    #[inline(always)]
    fn is_empty(&self) -> bool {
        self.0.iter().all(|&x| x == 0)
    }

    /// Subtract the letter counts of `other` from `self`, returning the result if possible.
    #[inline(always)]
    fn subtract(&self, other: &LetterFreq) -> Option<LetterFreq> {
        let mut result = [0u8; 26];
        for i in 0..26 {
            let a = self.0[i];
            let b = other.0[i];
            if a < b {
                return None;
            }
            result[i] = a - b;
        }
        Some(LetterFreq(result))
    }
}

/// A candidate word together with its letter frequency.
#[derive(Clone, Debug)]
struct Word {
    text: String,
    freq: LetterFreq,
}

/// Filter function that excludes solutions containing too many short words.
#[inline(always)]
fn is_valid_solution(solution: &[String]) -> bool {
    let short_word_count = solution.iter().filter(|w| w.len() <= 3).count();
    if solution.len() > 3 {
        short_word_count <= solution.len() / 2
    } else {
        true
    }
}

/// The anagram solver. (A built‑in dictionary or any word list may be used.)
pub struct AnagramSolver {
    words: Vec<Word>,
}

impl AnagramSolver {
    /// Create a new anagram solver from a word list.
    pub fn new(wordlist: Vec<String>) -> Self {
        let words: Vec<Word> = wordlist
            .into_iter()
            .map(|w| {
                let freq = LetterFreq::from_str(&w);
                Word { text: w, freq }
            })
            .collect();
        AnagramSolver { words }
    }

    /// Create an iterator that yields solutions one by one.
    ///
    /// The candidate word list is filtered (to those that can be used) and sorted so that
    /// longer words tend to appear first.
    pub fn iter(&self, phrase: &str) -> AnagramIterator {
        let target = LetterFreq::from_str(phrase);
        let mut candidates: Vec<Word> = self
            .words
            .iter()
            .filter(|word| target.subtract(&word.freq).is_some())
            .cloned()
            .collect();

        // Sort candidates so that longer words come first.
        candidates.sort_by(|a, b| {
            b.text
                .len()
                .cmp(&a.text.len())
                .then_with(|| a.text.cmp(&b.text))
        });

        // Create a new iterator with an initial stack state.
        AnagramIterator::new(candidates, target)
    }

    /// Convenience method that collects all valid solutions into a vector.
    pub fn solve(&self, phrase: &str) -> Vec<String> {
        self.iter(phrase)
            .filter_map(|solution| {
                if is_valid_solution(&solution) {
                    Some(solution.join(" "))
                } else {
                    None
                }
            })
            .collect()
    }
}

/// An iterator that yields anagram solutions.
///
/// The DFS search is implemented iteratively using two vectors:
///  - `stack`: Each element is a frame `(remaining, next_candidate_index)`
///  - `current_solution`: A list of candidate indices (into `candidates`)
/// that together (when looked up) form the current solution.
///
/// This approach avoids cloning the partial solution on each DFS step.
pub struct AnagramIterator {
    candidates: Vec<Word>,
    // Each stack frame holds: (remaining letters, next candidate index to try)
    stack: Vec<(LetterFreq, usize)>,
    // Holds the candidate indices of the current partial solution.
    current_solution: Vec<usize>,
}

impl AnagramIterator {
    fn new(candidates: Vec<Word>, target: LetterFreq) -> Self {
        // Start with a single (root) frame.
        AnagramIterator {
            candidates,
            stack: vec![(target, 0)],
            current_solution: Vec::new(),
        }
    }
}

impl Iterator for AnagramIterator {
    type Item = Vec<String>;

    fn next(&mut self) -> Option<Self::Item> {
        // Continue the DFS until we either find a solution or exhaust the search.
        while let Some((remaining, ref mut next_idx)) = self.stack.last_mut() {
            // If no letters remain, we have a complete solution.
            if remaining.is_empty() {
                let solution: Vec<String> = self
                    .current_solution
                    .iter()
                    .map(|&i| self.candidates[i].text.clone())
                    .collect();
                // Backtrack from this complete state.
                self.stack.pop();
                if !self.current_solution.is_empty() {
                    self.current_solution.pop();
                }
                if is_valid_solution(&solution) {
                    return Some(solution);
                }
                continue;
            }
            // Otherwise, if there are more candidates to try in this state…
            if *next_idx < self.candidates.len() {
                let candidate_index = *next_idx;
                *next_idx += 1; // move to the next candidate for this frame.
                let candidate = &self.candidates[candidate_index];
                if let Some(new_remaining) = remaining.subtract(&candidate.freq) {
                    // Push candidate into the current solution and add a new state.
                    self.current_solution.push(candidate_index);
                    self.stack.push((new_remaining, 0));
                }
            } else {
                // No more candidates at this level; backtrack.
                self.stack.pop();
                if !self.current_solution.is_empty() {
                    self.current_solution.pop();
                }
            }
        }
        // All search paths have been exhausted.
        None
    }
}
