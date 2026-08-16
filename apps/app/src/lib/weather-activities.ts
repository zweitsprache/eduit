export type WeatherMode = 'mcq' | 'trueFalse';
export type WeatherKind =
  | 'cloudy'
  | 'rain'
  | 'snow'
  | 'snowStorm'
  | 'sunSnow'
  | 'sunny'
  | 'storm'
  | 'windy';

export type WeatherItem = {
  id: string;
  weekday: string;
  city: string;
  temperature: number;
  weather: WeatherKind;
  statement: string;
  statementCorrect: boolean;
  options: Array<{ id: string; text: string; correct: boolean }>;
};

export const WEATHER_WEEKDAYS = [
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
  'Sonntag',
];

export const WEATHER_KINDS: Array<{
  value: WeatherKind;
  label: string;
  sentence: string;
  icon: string;
}> = [
  { value: 'cloudy', label: 'bewölkt', sentence: 'bewölkt', icon: '/weather/bewoelkt.svg' },
  { value: 'rain', label: 'Regen', sentence: 'regnet', icon: '/weather/regnen.svg' },
  { value: 'snow', label: 'Schnee', sentence: 'schneit', icon: '/weather/schneien.svg' },
  { value: 'snowStorm', label: 'Schnee und Sturm', sentence: 'schneit und ist stürmisch', icon: '/weather/schneien_und_stuermen.svg' },
  { value: 'sunSnow', label: 'Sonne und Schnee', sentence: 'sonnig und es schneit', icon: '/weather/schneienund_die_Sonne_scheint_.svg' },
  { value: 'sunny', label: 'sonnig', sentence: 'sonnig', icon: '/weather/sonnig.svg' },
  { value: 'storm', label: 'stürmisch', sentence: 'stürmisch', icon: '/weather/stuermen.svg' },
  { value: 'windy', label: 'windig', sentence: 'windig', icon: '/weather/windig.svg' },
];

export const SWISS_CITIES = [
  'Zürich',
  'Genf',
  'Basel',
  'Bern',
  'Lausanne',
  'Luzern',
  'St. Gallen',
  'Lugano',
  'Chur',
  'Winterthur',
  'Neuenburg',
  'Sitten',
];

export function weatherSentence(
  weekday: string,
  city: string,
  weather: WeatherKind,
  temperature: number,
) {
  const description = WEATHER_KINDS.find(({ value }) => value === weather)
    ?.sentence ?? weather;
  const temperatureText = temperature < 0
    ? `minus ${Math.abs(temperature)}`
    : String(temperature);
  const weatherText = weather === 'rain'
    ? `In ${city} regnet es am ${weekday}.`
    : weather === 'snow'
      ? `In ${city} schneit es am ${weekday}.`
      : weather === 'snowStorm'
        ? `In ${city} schneit es am ${weekday} und es ist stürmisch.`
        : weather === 'sunSnow'
          ? `In ${city} scheint am ${weekday} die Sonne und es schneit.`
          : `Am ${weekday} ist es in ${city} ${description}.`;
  return `${weatherText} Es ${Math.abs(temperature) === 1 ? 'ist' : 'sind'} ${temperatureText} Grad.`;
}

function shuffled<T>(values: T[]) {
  const next = [...values];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [next[index], next[target]] = [next[target], next[index]];
  }
  return next;
}

export function generateWeatherItems(input: {
  count: number;
  mode: WeatherMode;
  weatherKinds: WeatherKind[];
  minTemperature: number;
  maxTemperature: number;
  varyWeekdayAndCity?: boolean;
}) {
  const count = Math.min(
    input.count,
    SWISS_CITIES.length,
    input.weatherKinds.length * SWISS_CITIES.length,
  );
  const cities = shuffled(SWISS_CITIES).slice(0, count);
  const weekdays = shuffled(WEATHER_WEEKDAYS);
  const usedWeekdays = cities.map((_, index) => (
    weekdays[index % weekdays.length]
  ));
  const span = Math.max(0, input.maxTemperature - input.minTemperature);
  return cities.map((city, index) => {
    const weekday = usedWeekdays[index];
    const weather = input.weatherKinds[index % input.weatherKinds.length];
    const temperature = input.minTemperature + Math.floor(Math.random() * (span + 1));
    const correctSentence = weatherSentence(weekday, city, weather, temperature);
    const wrongWeather = input.weatherKinds.find((value) => value !== weather)
      ?? (weather === 'sunny' ? 'rain' : 'sunny');
    const wrongWeatherSentence = weatherSentence(weekday, city, wrongWeather, temperature);
    const wrongWeekday = usedWeekdays.find((value) => value !== weekday);
    const wrongWeekdaySentence = weatherSentence(
      wrongWeekday ?? weekday,
      city,
      weather,
      temperature,
    );
    const wrongCity = cities.find((value) => value !== city);
    const wrongCitySentence = weatherSentence(
      weekday,
      wrongCity ?? city,
      weather,
      temperature,
    );
    const wrongTemperature = temperature + (temperature >= input.maxTemperature ? -5 : 5);
    const wrongTemperatureSentence = weatherSentence(weekday, city, weather, wrongTemperature);
    const statementCorrect = input.mode === 'trueFalse' ? index % 2 === 0 : true;
    const statement = statementCorrect
      ? correctSentence
      : (index % 4 === 1 ? wrongWeatherSentence : wrongTemperatureSentence);
    const stamp = Date.now();
    return {
      id: `weather-${stamp}-${index}`,
      weekday,
      city,
      temperature,
      weather,
      statement,
      statementCorrect,
      options: shuffled([
        { text: correctSentence, correct: true },
        {
          text: wrongWeekday
            ? wrongWeekdaySentence
            : wrongWeatherSentence,
          correct: false,
        },
        {
          text: input.varyWeekdayAndCity && wrongCity
            ? wrongCitySentence
            : (wrongWeekday ? wrongWeatherSentence : wrongTemperatureSentence),
          correct: false,
        },
      ]).map((option, optionIndex) => ({
        id: `weather-option-${stamp}-${index}-${optionIndex}`,
        ...option,
      })),
    } satisfies WeatherItem;
  });
}
