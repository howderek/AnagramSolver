# **Anagram Solver & ROT Cipher Tool**

This is a Rust-based command-line tool that efficiently finds anagrams of a given phrase and can also decode simple rotation (ROT) ciphers. It is designed to be fast, extensible, and self-contained, using an embedded wordlist for anagram solving. The tool includes both a library (`lib.rs`) and a command-line binary (`anagrams`).

Rather than finding all anagrams, this anagram solver tries to find the best anagrams by excluding solutions where small words make up the majority of the solution. This provides more interesting solutions for longer phrases.

## **Features**
- **Anagram Solver**: Finds all valid anagrams of an input phrase based on a built-in wordlist.
- **ROT Cipher Solver**: Deciphers ROT13 (default) and attempts all ROT-N shifts if a wordlist is provided.
- **Embedded Dictionary**: Includes a default wordlist in the binary, so it works out of the box.
- **Lightweight & Fast**: No dependencies beyond the Rust standard library.

---

## **Installation**

### **1. Clone and Build**
Ensure you have Rust installed. Then, clone this repository and build the binary:

```sh
git clone https://github.com/your-repo/anagrams.git
cd anagrams
cargo build --release
```

This will produce an optimized binary at:

```
./target/release/anagrams
```

### **2. (Optional) Install System-Wide**
To install the binary globally:

```sh
cargo install --path .
```

This allows you to run `anagrams` from anywhere.

---

## **Usage**

### **Find Anagrams**
```sh
anagrams "rustlang" | head -n10
```
Output:
```
arts lung
lang str u
lang u str
lung arts
lung rats
lung star
lung str a
lung a str
rats lung
star lung
...
```

By default, the tool uses an embedded wordlist. You can provide your own:

```sh
anagrams --wordlist /path/to/words.txt "listen"
```

---

### **Decode ROT13** (and other shifts)
```sh
anagrams -c rot13 "uryyb"
```
Output:
```
hello +13
```

---

## **How It Works**
### **Anagram Solver**
- The input phrase is converted into a letter frequency map.
- The algorithm uses a recursive backtracking search with memoization to find valid word combinations that exactly match the input’s letters.
- A built-in wordlist is used unless an external one is provided.

### **ROT Cipher Solver**
- If no wordlist is provided, the tool performs a simple ROT13 transformation.
- If a wordlist is provided, it tests all shifts (ROT1 to ROT25) and only returns valid dictionary words.

---

## **Extending the Library**
The library is designed to be extensible. To add a new cipher solver:
1. Implement the `CipherSolver` trait:
    ```rust
    pub trait CipherSolver {
        fn solve(&self, input: &str) -> Vec<String>;
    }
    ```
2. Register it in the binary CLI.
3. Compile and run.

---

## **License**
This project is released under the MIT License or Apache 2.0 license at your choice.

---

## **Contributions**
Contributions are welcome! Please open an issue or submit a pull request.