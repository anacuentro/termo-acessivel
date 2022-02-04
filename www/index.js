// The maximum length of generated text before it + emoji won't fit in a tweet.
let maxGenLength = 196;

const includeEmoji = document.getElementById('include-emoji');

const tweet = document.getElementById('tweet');
tweet.addEventListener('click', () => {
  const encoded = encodeURI(output.value).replaceAll('&', '%26');
  window.open(`https://twitter.com/intent/tweet?text=${encoded}`);
});

const input = document.getElementById('input');
const output = document.getElementById('output');

const describe = (indexes) => {
  if (indexes.length === 0) return null;

  const ords = indexes.map((i) => ord(i));

  if (ords.length === 1) return ords[0];

  return ords.reduce(
    (text, value, i, array) => {
      return text + (i < array.length - 1 ? ', ' : ' e ') + value;
    })
};

const describeLine = (line, num, chopAggression) => {
  const decoded = blockTypes(line);

  const hasPerfect = decoded.perfectIndexes.length > 0;
  const hasMisplaced = decoded.misplacedIndexes.length > 0;

  const perfectWord = chopAggression >= 8 ? 'sim' : 'perfeito';
  const perfect = hasPerfect ? `${describe(decoded.perfectIndexes)} ${perfectWord}` : null;

  const misplacedList = describe(decoded.misplacedIndexes);

  const wrongPlace = chopAggression >= 6 ? chopAggression >= 7 ? 'não' : 'errado' : 'no lugar errado';
  const correctBut = chopAggression >= 3 ? `${misplacedList} ${wrongPlace}` : `${misplacedList} correto mas ${wrongPlace}`;
  const perfectBut = chopAggression >= 2 ? `. ${misplacedList} ${wrongPlace}` : `, mas ${misplacedList} ${wrongPlace}`

  const misplaced = hasPerfect ? perfectBut : correctBut;

  let explanation = '';

  if (!hasPerfect && !hasMisplaced)
    explanation = 'Nada.';
  else if (decoded.perfectIndexes.length === 5)
    explanation = 'Ganhou!';
  else if (decoded.misplacedIndexes.length === 5)
    explanation = chopAggression >= 1 ? 'tudo na ordem errada.' : 'todas as letras corretas, mas na ordem errada.';
  else if (hasPerfect && hasMisplaced)
    explanation = `${perfect}${misplaced}.`
  else if (hasMisplaced)
    explanation = `${misplaced}.`
  else
    explanation = `${perfect}.`

  const prefix = chopAggression >= 5 ? `${num}.` : `Linha ${num}:`;

  const result = `${prefix} ${explanation}\n`

  if (chopAggression >= 4)
    return result.replaceAll(' e ', ' & ');

  return result;
}

const ord = (i) => {
  switch (i) {
    case 1: return '1ª';
    case 2: return '2ª';
    case 3: return '3ª';
    default: return `${i}ª`
  }
}

const blockTypes = (line) => {
  let actualIndex = 0;
  let visualIndex = 1;

  const misplacedIndexes = [];
  const perfectIndexes = [];

  while (actualIndex < line.length) {
    switch (line.charCodeAt(actualIndex)) {
      // Dark mode:
      case 11035:
      // Light mode:
      case 11036:
        actualIndex += 1;
        visualIndex += 1;
        break;
      case 55357:
        switch (line.charCodeAt(actualIndex + 1)) {
          // High contrast:
          case 57318:
          // Regular contrast:
          case 57320:
            misplacedIndexes.push(visualIndex++);
            break;
          // High contrast:
          case 57319:
          // Regular contrast:
          case 57321:
            perfectIndexes.push(visualIndex++);
            break;
          default:
            return undefined;
        }
        actualIndex += 2;
        break;
      default:
        return undefined;
    }
  }

  return {
    misplacedIndexes: misplacedIndexes,
    perfectIndexes: perfectIndexes,
  };
}

const isGameLine = (line) => {
  return line && line.length > 0 && blockTypes(line) !== undefined;
}

const render = () => {
  output.value = '';
  const lines = input.value.split('\n');
  const emojiLines = [];

  lines.forEach((line) => {
    if (isGameLine(line))
      emojiLines.push(line);
    else
      output.value += `${line}\n`;
  });

  const descriptiveLines = [];
  let chopAggression = 0;

  while (chopAggression === 0 || descriptiveLines.join('\n').length + output.value.length > maxGenLength ) {
    descriptiveLines.splice(0,descriptiveLines.length);
    emojiLines.forEach((line) => {
      descriptiveLines.push(describeLine(line, descriptiveLines.length + 1, chopAggression));
    });
    if (chopAggression++> 20) break;
  }

  descriptiveLines.forEach((line) => {
    output.value += line;
  });

  if (includeEmoji.checked) {
    output.value += '\n';

    emojiLines.forEach((line) => {
      output.value += `${line}\n`;
    });
  }

  output.value = output.value.trim();
}

input.addEventListener('input', render);

const handleIncludeEmoji = (include) => {
  maxGenLength = include ? 196 : 280;
  render();
}

if (document.cookie === 'include-emoji=true') {
  includeEmoji.checked = true;
  handleIncludeEmoji(true);
} else
  handleIncludeEmoji(false);

includeEmoji.addEventListener('change', () => {
  if (includeEmoji.checked) {
    alert(
      'Os emojis são lindos, mas podem ser frustrantes para quem usa leitores de tela e outras ferramentas de acessibilidade.' +
      '\n\n' +
      'Por favor, considere seu público antes de twittar. ❤️'
    );
  }

  document.cookie = `include-emoji=${includeEmoji.checked.toString()}; SameSite=Strict`;
  handleIncludeEmoji(includeEmoji.checked);
});
