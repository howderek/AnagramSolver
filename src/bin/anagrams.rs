use anagramsolver::{AnagramSolver, CipherSolver, RotSolver, DEFAULT_WORDLIST};
use std::collections::HashSet;
use std::env;
use std::fs;
use std::io::Write;

fn print_usage() {
    eprintln!("Usage: anagrams [OPTIONS] <input>");
    eprintln!();
    eprintln!("Options:");
    eprintln!("  -c <cipher>        Specify cipher type (anagrams, rot13). Default is anagrams.");
    eprintln!("  --wordlist <file>  Path to a wordlist file.");
    eprintln!("  --min <n>          Ignore words shorter than <n> characters.");
    eprintln!("  -h, --help         Print this help message.");
}

fn load_wordlist(path: &str) -> Vec<String> {
    fs::read_to_string(path)
        .unwrap_or_else(|_| panic!("Failed to read wordlist file: {}", path))
        .lines()
        .map(|line| line.trim().to_string())
        .filter(|line| !line.is_empty())
        .collect()
}

fn load_wordset(path: &str) -> HashSet<String> {
    load_wordlist(path).into_iter().collect()
}

fn main() {
    let args: Vec<String> = env::args().skip(1).collect();
    if args.is_empty() {
        print_usage();
        return;
    }

    let mut cipher_type = "anagrams".to_string();
    let mut wordlist_path: Option<String> = None;
    let mut min_length = 1; // Default: no filtering
    let mut input = None;
    let mut i = 0;
    while i < args.len() {
        match args[i].as_str() {
            "-h" | "--help" => {
                print_usage();
                return;
            }
            "-c" => {
                if i + 1 < args.len() {
                    cipher_type = args[i + 1].clone();
                    i += 1;
                } else {
                    eprintln!("Error: Missing cipher type after -c");
                    return;
                }
            }
            "--wordlist" => {
                if i + 1 < args.len() {
                    wordlist_path = Some(args[i + 1].clone());
                    i += 1;
                } else {
                    eprintln!("Error: Missing file path after --wordlist");
                    return;
                }
            }
            "--min" => {
                if i + 1 < args.len() {
                    min_length = args[i + 1].parse::<usize>().unwrap_or_else(|_| {
                        eprintln!("Error: Invalid value for --min");
                        std::process::exit(1);
                    });
                    i += 1;
                } else {
                    eprintln!("Error: Missing value after --min");
                    return;
                }
            }
            other => {
                if input.is_none() {
                    input = Some(other.to_string());
                } else {
                    let curr = input.take().unwrap();
                    input = Some(format!("{} {}", curr, other));
                }
            }
        }
        i += 1;
    }

    let input = match input {
        Some(s) => s,
        None => {
            eprintln!("Error: No input provided");
            print_usage();
            return;
        }
    };
    let mut wordlist = match wordlist_path {
        Some(path) => load_wordlist(&path),
        None => DEFAULT_WORDLIST
            .lines()
            .map(|w| w.trim().to_string())
            .collect(),
    };
    wordlist = wordlist
        .into_iter()
        .filter(|w| w.len() >= min_length)
        .collect();

    match cipher_type.to_lowercase().as_str() {
        "anagrams" => {
            let solver = AnagramSolver::new(wordlist);
            for solution in solver.iter(&input) {
                if let Err(_) = writeln!(std::io::stdout(), "{}", solution.join(" ")) {
                    std::process::exit(0);
                }
            }
        }
        "rot13" => {
            let solver = RotSolver::new(wordlist);
            for solution in solver.solve(&input) {
                println!("{}", solution);
            }
        }
        other => {
            eprintln!("Unknown cipher type: {}", other);
            print_usage();
        }
    }
}
