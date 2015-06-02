//.js (c) 2013 Derek Howard
//A library for working with playing cards.
/*jslint browser:true*/
/*global wordlist, $, console, sorted, words, sortedList*/

/*
    WordEngine: a powerful library for doing stuff with words.
    requires two globals: words and sortedList
*/

(function (scope) {
    
    'use strict';

    var alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'],
        keypad = ['', '', 'abc', 'def', 'ghi', 'jkl', 'mno', 'pqrs', 'tuv', 'wxyz'],
        sizedLists = (function () {
            var ary = [],
                i = 0;
            sortedList.forEach(function (word) {
                var obj = {};
                obj.word = word;
                obj.place = i;
                if (ary[word.length]) {
                    ary[word.length].push(obj);
                } else {
                    ary[word.length] = [obj];
                }
                i += 1;
            });
            return ary;
        }()),
        sizedWords = (function () {
            var ary = [],
                i = 0;
            words.forEach(function (word) {
                if (ary[word.length]) {
                    ary[word.length].push(word);
                } else {
                    ary[word.length] = [word];
                }
            });
            return ary;
        }());
        
        
    scope.WordEngine = {
        
        words: words,
        
        numerical: function (word) {
            var result = '',
                i = 0,
                j = 0;
            if (typeof word === 'string') {
                result = [];
                for (j = 0; j < word.length; j += 1) {
                    for (i = 0; i < alphabet.length; i += 1) {
                        if (alphabet[i] === word[j]) {
                            result.push((i + 1));
                        }
                    }
                }
                return result.length > 1 ? result : result[0];
            } else if (typeof word === 'number') {
                if (word > 0) {
                    return alphabet[(word - 1) % 26];
                } else {
                    return alphabet[(25 - (Math.abs(word) % 26))];
                }
            } else if (typeof word === 'object') {
                word.forEach(function (number) {
                    result += scope.WordEngine.numerical(number);
                });
                return result;
            }
        },
        
        anagram: function (word) {
            word = word.toLowerCase();
            var anagrams = [],
                sorted = '',
                j = 0,
                times = 0;
            alphabet.forEach(function (letter) {
                times = (word.match(new RegExp(letter, 'g'))) ? word.match(new RegExp(letter, 'g')).length : 0;
                for (j = 0; j < times; j += 1) {
                    sorted += letter;
                }
            });
            anagrams.isAWord = false;
            sizedLists[word.length].forEach(function (testWord) {
                if (sorted === testWord.word) {
                    if (words[testWord.place] !== word) {
                        anagrams.push(words[testWord.place]);
                    } else {
                        anagrams.isAWord = true;
                    }
                }
            });
            if (anagrams.length > 0) {
                console.log('Anagrams: ' + anagrams.join(' '));
            }
            return anagrams;
        },

        fillInTheBlanks: function (word) {
            word = word.toLowerCase();
            var matches = [];
            if (sizedWords[word.length]) {
                sizedWords[word.length].forEach(function (testWord) {
                    var match = true,
                        i = 0;
                    word.split('').forEach(function (letter) {
                        if (match && word[i] !== '-') {
                            match = (letter === testWord[i]);
                        }
                        i += 1;
                    });
                    if (match && testWord.length === word.length) {
                        matches.push(testWord);
                    }
                });
                console.log('Fill in the blanks: ' + matches.join(' '));
                return matches;
            }
            return matches;
        },

        isAWord: function (word) {
            var isAWord = false;
            sizedWords[word.length].forEach(function (testWord) {
                if (testWord === word) {
                    isAWord = true;
                }
            });
            return isAWord;
        },

        scramble: function (word) {
            var newWord = [],
                oldWord = word.split('');
            while (oldWord.length > 0) {
                newWord.push(oldWord.splice(((Math.random() * 10000) % oldWord.length), 1)[0]);
            }
            return newWord.join('');
        },

        caesarShift: function (word, shift) {
            var i = 0,
                shiftedWord = '',
                results = [],
                numbers = scope.WordEngine.numerical(word);
            
            if (typeof shift === 'undefined') {
                for (i = -13; i < 14; i += 1) {
                    shiftedWord = scope.WordEngine.caesarShift(word, i);
                    if (scope.WordEngine.isAWord(shiftedWord) && shiftedWord !== word) {
                        results.push({
                            word: shiftedWord,
                            shift: i
                        });
                    }
                }
                return results;
            } else if (typeof shift === 'number') {
                for (i = 0; i < numbers.length; i += 1) {
                    numbers[i] = numbers[i] + shift;
                }
                return scope.WordEngine.numerical(numbers);
            }
        },
        
        //magical function that creates alphabets based on symbols found in a string
        //once you have this alphabet you can look at where each symbol is used and how often
        symbolicAnalysis: function (wordarray) {
            var splitWords = (function () {
                    var result = [],
                        split = [];
                    if (typeof wordarray === 'string') {
                        split = wordarray.split(' ');
                    }
                    split.forEach(function (word) {
                        result.push(word.split(''));
                    });
                    return result;
                }()),
                symbolicWords = [],
                symbolicAlphabet = [],
                currentWord = 0,
                Letter = function (symbol, assignedNumber) {
                    this.symbol = symbol;
                    this.assignedNumber = assignedNumber;
                    this.frequency = 1;
                    this.frequencyByWord = [];
                    this.represents = '';
                };
            
            //allows the letter to put itself in a string
            Letter.prototype.substitute = function (str) {
                return str.replace(new RegExp(str, 'g'), this.represents);
            };
            
            splitWords.forEach(function (word) {
                var symbolicWord = [],
                    assignedLetter = symbolicAlphabet.length,
                    lengthFound = false;
                    
                symbolicAlphabet.forEach(function (symbolicLetter) {
                    symbolicLetter.frequencyByWord.push(0);
                });
                //create all the symbolic words and the symbolic alphabet
                word.forEach(function (symbol) {
                    var found = false,
                        i = 0;
                    symbolicAlphabet.forEach(function (symbolicLetter) {
                        if (symbolicLetter.symbol === symbol) {
                            found = true;
                            symbolicLetter.frequency += 1;
                            symbolicLetter.frequencyByWord[currentWord] += 1;
                            symbolicWord.push(symbolicLetter);
                        }
                    });
                    if (!found) {
                        symbolicAlphabet.push(new Letter(symbol, assignedLetter));
                        for (i = 0; i < currentWord; i += 1) {
                            symbolicAlphabet[symbolicAlphabet.length - 1].frequencyByWord.push(0);
                        }
                        symbolicAlphabet[symbolicAlphabet.length - 1].frequencyByWord.push(1);
                        symbolicWord.push(symbolicAlphabet[symbolicAlphabet.length - 1]);
                        assignedLetter += 1;
                    }
                });
                symbolicWords.push(symbolicWord);
                currentWord += 1;
            });
            
            return {
                alphabet: symbolicAlphabet,
                words: symbolicWords
            };
        },
        
        //solves simple substitution ciphers
        substitution: function (wordarray) {
            //holds letter objects
            var analyzed = scope.WordEngine.symbolicAnalysis(wordarray),
                keys = [],
                possibleSolutions = [],
                i = 0;
            analyzed.words.forEach(function (word) {
                possibleSolutions.push([]);
                sizedWords[word.length].forEach(function (testWord) {
                    var testAnalysis = scope.WordEngine.symbolicAnalysis(testWord),
                        testSuccessful = true,
                        j = 0;
                    for (j = 0; j < testAnalysis.words[0].length; j += 1) {
                        if (testAnalysis.words[0][j].frequencyByWord[0] !== word[j].frequencyByWord[i]) {
                            testSuccessful = false;
                        }
                    }
                    if (testSuccessful) {
                        possibleSolutions[i].push(testAnalysis);
                    }
                });
                i += 1;
            });
            
            possibleSolutions[0].forEach(function (solution) {
                solution.alphabet.forEach
            });
            
            return possibleSolutions;
        },

        keypadToWord: function (nums) {
            var word;
            if (nums.match(/0-9/g)) {
                nums.split('').forEach(function (char) {
                    return 'NOT YET IMPLEMETED';
                });
            }
            return false;
        }
    };

}(window));