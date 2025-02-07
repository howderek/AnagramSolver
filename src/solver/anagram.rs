// Helper type wrapping an array of 26 letter counts (for letters a–z).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
struct LetterFreq([u8; 26]);

impl LetterFreq {
    // fn new() -> Self {
    //     LetterFreq([0; 26])
    // }

    /// Compute the letter frequency for the given string (ignoring non‑letters).
    fn from_str(s: &str) -> Self {
        let mut freq = [0; 26];
        for c in s.chars() {
            if c.is_ascii_alphabetic() {
                let idx = (c.to_ascii_lowercase() as u8 - b'a') as usize;
                freq[idx] += 1;
            }
        }
        LetterFreq(freq)
    }

    /// Check whether there are no letters left.
    fn is_empty(&self) -> bool {
        self.0.iter().all(|&x| x == 0)
    }

    /// Try to “subtract” the frequency of `other` from `self`.
    /// Returns `Some(result)` if every letter in `other` is available.
    fn subtract(&self, other: &LetterFreq) -> Option<LetterFreq> {
        let mut result = [0; 26];
        for i in 0..26 {
            if self.0[i] < other.0[i] {
                return None;
            }
            result[i] = self.0[i] - other.0[i];
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

/// Filtering function that excludes solutions containing more than half short words
fn is_valid_solution(solution: &[String]) -> bool {
    let short_word_count = solution.iter().filter(|w| w.len() <= 3).count();
    if solution.len() > 3 {
        short_word_count <= solution.len() / 2
    } else {
        true
    }
}

/// The anagram solver.
///
/// It is constructed with a word list. If none is provided, a built‑in default
/// dictionary is used.
pub struct AnagramSolver {
    words: Vec<Word>,
}

impl AnagramSolver {
    /// Create a new anagram solver.
    ///
    /// If `wordlist` is `None`, a built‑in default dictionary is used.
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
    /// The candidate word list is filtered to only include words that can be used,
    /// then sorted (by descending length so that longer words tend to appear earlier).
    /// The iterator yields each complete solution (a vector of words) that satisfies
    /// the filter (no more than three words of length 1 or 2).
    pub fn iter(&self, phrase: &str) -> AnagramIterator {
        let target = LetterFreq::from_str(phrase);
        let mut candidates: Vec<Word> = self
            .words
            .iter()
            .filter(|word| target.subtract(&word.freq).is_some())
            .cloned()
            .collect();
        // Sort candidates so that longer words come first; this helps yield “interesting” solutions earlier.
        candidates.sort_by(|a, b| {
            b.text
                .len()
                .cmp(&a.text.len())
                .then_with(|| a.text.cmp(&b.text))
        });

        // Initialize the stack with the starting state.
        let initial_state = StackItem {
            remaining: target,
            solution: Vec::new(),
            candidate_index: 0,
        };

        AnagramIterator {
            candidates,
            stack: vec![initial_state],
        }
    }

    /// Convenience method that collects all solutions into a vector.
    /// (Warning: may run out of memory for very large searches.)
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

/// A frame representing one state of the DFS search.
struct StackItem {
    remaining: LetterFreq,
    solution: Vec<String>,
    candidate_index: usize,
}

/// An iterator that yields anagram solutions as vectors of words.
pub struct AnagramIterator {
    candidates: Vec<Word>,
    stack: Vec<StackItem>,
}

impl Iterator for AnagramIterator {
    type Item = Vec<String>;

    fn next(&mut self) -> Option<Self::Item> {
        // The iterator runs an explicit DFS.
        while let Some(top) = self.stack.last_mut() {
            // If there are no remaining letters, we have a complete solution.
            if top.remaining.is_empty() {
                // Pop this complete state off the stack.
                let solution = self.stack.pop().unwrap().solution;
                // Only yield the solution if it passes our filter.
                if is_valid_solution(&solution) {
                    return Some(solution);
                }
                continue;
            }

            // If there are more candidates to try at this level…
            if top.candidate_index < self.candidates.len() {
                let index = top.candidate_index;
                // Increment the candidate index for this state.
                top.candidate_index += 1;
                let candidate = &self.candidates[index];
                if let Some(new_remaining) = top.remaining.subtract(&candidate.freq) {
                    // Build a new solution state.
                    let mut new_solution = top.solution.clone();
                    new_solution.push(candidate.text.clone());
                    let new_frame = StackItem {
                        remaining: new_remaining,
                        solution: new_solution,
                        candidate_index: 0,
                    };
                    self.stack.push(new_frame);
                }
            } else {
                // No more candidates at this level; backtrack.
                self.stack.pop();
            }
        }
        // Exhausted the search.
        None
    }
}
