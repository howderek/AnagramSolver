//script.js (c) 2013 Derek Howard
//Handles user interaction with WordEngine
/*jslint browser:true*/
/*global wordlist, $, console, WordEngine, alphabet, wordMatrix, words*/

var oldWord = '*',
    panelHTML = '<div class="col-sm-12"><div class="panel panel-default"><div class="panel-heading"><h3 class="panel-title">TITLE</h3></div><div class="panel-body">CONTENT</div></div></div>',
    startTime = 0,
    endTime = 0,
    elapsed = 0,
    red,
    blue,
    green,
    wordOfTheDay = WordEngine.words[((new Date()).getFullYear() * (new Date()).getMonth() + ((new Date()).getDate() * 1000))],
    pulsing = false,
    commands = {
        random: function () {
            'use strict';
            var str = '',
                i;
            for (i = 0; i < 10; i += 1) {
                str += WordEngine.words[Math.floor(Math.random() * 10000000) % words.length] + '<br>';
                document.getElementById('results').innerHTML = panelHTML.replace('TITLE', 'Ten Random Words').replace('CONTENT', str);
            }
        },
        pulseStep: function (element) {
            'use strict';
            red = (red !== undefined) ? red : 255;
            green = green || 0;
            blue = blue || 0;
            if (red === 255 && green < 255 && blue === 0) {
                green += 2.5;
            } else if (red > 0 && green === 255 && blue === 0) {
                red -= 2.5;
            } else if (blue < 255 && green === 255 && red === 0) {
                blue += 2.5;
            } else if (green > 0 && blue === 255 && red === 0) {
                green -= 2.5;
            } else if (red < 255 && blue === 255 && green === 0) {
                red += 2.5;
            } else {
                blue -= 2.5;
            }
            if (pulsing) {
                element.style.backgroundColor = 'rgb(' + red + ', ' + green + ', ' + blue + ')';
                setTimeout(function () {commands.pulseStep(element); }, 1000 / 60);
            } else {
                element.style.backgroundColor = '#fafafa';
            }
        },
        colorful: function () {
            'use strict';
            pulsing = !pulsing;
            commands.pulseStep(document.body);
        },
        bigbenchmark: function () {
            'use strict';
            var currentBiggest = '',
                count = 0,
                start = Date.now(),
                stop,
                anagrams;
            console.log('BigBenchmark starting...');
            WordEngine.words.forEach(function (word) {
                anagrams = WordEngine.anagram(word);
                if (anagrams.length > count) {
                    currentBiggest = word;
                    count = anagrams.length;
                    console.log('New word with most anagrams: ' + currentBiggest);
                }
            });
            stop = Date.now();
            console.log('Done. Completed in ' + (stop - start) + 'ms');
            console.log('The word with the most anagrams is ' + currentBiggest + ' with ' + count + ' anagrams');
            console.log('Anagrams: ' + WordEngine.anagram(currentBiggest).join(' '));
            document.getElementById('results').innerHTML = panelHTML.replace('TITLE', 'Benchmark Completed').replace('CONTENT', currentBiggest);
        }
    };

function getUrlKeys(url) {
	'use strict';
	if (url === undefined) {url = document.location.toString(); }
	url = url.replace(/\%20/g, '');
	//seperates the parts of the url
	var parts = url.split('?'),
		keyValues,
		key = {};
	//splits into sperate key=values
	if (parts[1] === undefined) {return 1; }
	keyValues = parts[1].split('&');
	keyValues.forEach(function (keyValue) {
		var keyAndValue = keyValue.split('=');
		key[keyAndValue[0]] = keyAndValue[1];
	});
	return key;
}

function stats(input, elapsed, wordCount) {
    'use strict';
    var str = '\'' + input + '\' is ' + input.length + ' characters long',
        noWhiteSpace = input.replace(/ /g, ''),
        vowels;
    vowels = (noWhiteSpace.replace(/a|e|i|o|u/g, '~').split('~').length) - 1;
    str += '<br>There are ' + noWhiteSpace.length + ' non-whitespace characters: ' + vowels + ' vowels, and ' + (noWhiteSpace.length - vowels) + ' non-vowels (consonants or dashes)';
    str += '<br>It took ' + elapsed + 'ms to complete operations on ' + wordCount.total + ' word' + ((wordCount.total - 1) ? 's' : '');
    str += '<br>In all, there were ' + wordCount.anagrams + ' anagrams found and ' + wordCount.fill + ' fill-in-the-blank solutions';
    return str;
}

function update() {
    'use strict';
    var anagrams,
        blanks,
        caesars,
        wordCount = {},
        shareLink = document.location.toString().split('?')[0] + '?q=' + encodeURI(document.getElementById('bigBar').value),
        scrambles = [],
        start = Date.now(),
        stop;
    wordCount.anagrams = 0;
    wordCount.total = 0;
    wordCount.fill = 0;
    //Beginning of displaying results
    document.getElementById('results').innerHTML = '';
    document.getElementById('bigBar').value.split(' ').forEach(function (word) {
        //fill in the blank or anagram
        if (!(word.match('-')) && word.length > 2) {
            anagrams = WordEngine.anagram(word);
            if (anagrams.length > 0) {
                document.getElementById('results').innerHTML += panelHTML.replace('TITLE', ('Anagrams for \'' + word + '\' (' + word.length + ' letters long)')).replace('CONTENT', anagrams.join('<br/>')).replace('panel-default', 'panel-success');
                wordCount.anagrams = anagrams.length;
            } else {
                document.getElementById('results').innerHTML += panelHTML.replace('TITLE', ('\'' + word + '\' (' + word.length + ' letters long) has no anagrams')).replace('CONTENT', ('\'' + word + '\' ' + (anagrams.isAWord ? 'is' : 'isn\'t') + ' a word on my wordlist.')).replace('panel-default', 'panel-danger');
            }
            wordCount.total += 1;
            scrambles.push(WordEngine.scramble(word));
            caesars = WordEngine.caesarShift(word);
            if (caesars.length > 0) {
                var caesarString = '';
                caesars.forEach(function (match) {
                    caesarString += '<strong>' + match.word + '</strong> (shifted ' + match.shift + ')<br>';
                });
                document.getElementById('results').innerHTML += panelHTML.replace('TITLE', ('Caesar Shifts')).replace('CONTENT', caesarString).replace('panel-default', 'panel-success');
            }
        } else if (word.length > 2) {
            blanks = WordEngine.fillInTheBlanks(word);
            if (blanks.length > 0) {
                document.getElementById('results').innerHTML += panelHTML.replace('TITLE', 'Possible Solutions of \'' + word + '\' (' + word.length + ' letters long)').replace('CONTENT', blanks.join('<br/>')).replace('panel-default', 'panel-success');
                wordCount.fill += blanks.length;
            } else {
                document.getElementById('results').innerHTML += panelHTML.replace('TITLE', ('\'' + word + '\' (' + word.length + ' letters long) has no solutions')).replace('CONTENT', 'Do you want a hug?').replace('panel-default', 'panel-danger');
            }
            wordCount.total += 1;
        } else {
            scrambles.push(word);
        }
    });
    stop = Date.now();
    document.getElementById('results').innerHTML += panelHTML.replace('TITLE', 'Statistics').replace('CONTENT', stats(document.getElementById('bigBar').value, (stop - start), wordCount));
    if (scrambles.length > 0) {
        document.getElementById('results').innerHTML += panelHTML.replace('TITLE', 'Scrambled').replace('CONTENT', scrambles.join(' '));
    }
    document.getElementById('results').innerHTML += panelHTML.replace('TITLE', 'Link to this result').replace('CONTENT', ('<a href="' + shareLink + '">' + shareLink + '</a>'));
}

function parse() {
    'use strict';
    var command;
    if (document.getElementById('bigBar').value.match('!')) {
        command = document.getElementById('bigBar').value.split('!')[1];
        commands[command]();
    } else {
        update();
    }
}

document.getElementById('bigBar').onkeydown = function (event) {
    'use strict';
    if (event.keyCode === 13 && document.getElementById('bigBar').value.length > 1) {
        parse();
    }
};

function handleInput() {
    'use strict';
    if (document.getElementById('bigBar').value !== oldWord && document.getElementById('bigBar').value.length > 2 && !(document.getElementById('bigBar').value.match(/!|-/g))) {
        update();
        oldWord = document.getElementById('bigBar').value;
    } else if (document.getElementById('bigBar').value.match('-') && document.getElementById('bigBar').value !== oldWord) {
        document.getElementById('results').innerHTML = panelHTML.replace('TITLE', 'Ready to run WordEngine on \'' + document.getElementById('bigBar').value + '\'').replace('CONTENT', 'Press ENTER to solve').replace('panel-default', 'panel-primary');
        oldWord = document.getElementById('bigBar').value;
    } else if (document.getElementById('bigBar').value.match('!') && document.getElementById('bigBar').value !== oldWord) {
        document.getElementById('results').innerHTML = panelHTML.replace('TITLE', 'Command Mode').replace('CONTENT', '<strong>!wordlist</strong>: displays wordlist<br><strong>!random</strong>: shows ten random words<br><strong>!colorful</strong>: makes WordEngine <em>a little</em> more colorful (toggles)').replace('panel-default', 'panel-primary');
        oldWord = document.getElementById('bigBar').value;
    } else if (document.getElementById('bigBar').value.length < 1 && document.getElementById('bigBar').value !== oldWord) {
        oldWord = '';
        document.getElementById('results').innerHTML = panelHTML.replace('TITLE', 'Welcome to <strong>WordEngine</strong>!').replace('CONTENT', 'Great for solving crosswords and unscrambling puzzles!<br><br>Type a word to get anagrams and caesar shifts (Example: <a href="index.html?q=tesla">tesla</a>), or type with dashes (Example: <a href="index.html?q=d---k">d---k</a>) to find possible fill in the blank solutions.<br><br>Type an exclalmation mark to run commands (Example: <a href="index.html?q=!random">!random</a>)<br><br> It is written entirely in JavaScript, uses <a href="http://getbootstrap.com">Twitter Bootstrap</a> and is responsive!<br><br>The current wordlist is ' + words.length.toLocaleString()  + ' words long, and your benchmark completed in ' + elapsed + 'ms.<br><br>The word of the day is <em>' + wordOfTheDay + '</em><br><br>WordEngine &copy 2013 <a href="http://howderek.com">Derek Howard</a>, distributed under the MIT license. <a href="http://github.com/howderek/">GitHub</a>');
    }
}

$('.header img').click(function () {
    'use strict';
    document.getElementById('bigBar').value = '';
    handleInput();
});

function begin() {
    'use strict';
    startTime = Date.now();
    console.log('Benchmarking...');
    WordEngine.anagram('het');
    WordEngine.fillInTheBlanks('u--im-t-');
    WordEngine.anagram('nsewra');
    WordEngine.anagram('ot');
    WordEngine.fillInTheBlanks('l-fe');
    WordEngine.anagram('teh');
    WordEngine.anagram('verseuni');
    WordEngine.fillInTheBlanks('and');
    WordEngine.anagram('vethirynge');
    endTime = Date.now();
    elapsed = endTime - startTime;
    console.log('Done (returned 42). Completed in ' + elapsed + 'ms (instant update will run every ' + ((elapsed + 1) * 2) + 'ms)\nRunning...');
    var urlOptions = getUrlKeys();
    if (urlOptions.q) {
        document.getElementById('bigBar').value = urlOptions.q;
        oldWord = document.getElementById('bigBar').value;
        parse();
    }
    document.getElementById('bigBar').value = '';
    handleInput();
    setInterval(handleInput, ((elapsed + 1) * 2));
}
begin();
