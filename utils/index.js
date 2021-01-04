export const capitalize = (str) => {
  return str.substring(0, 1).toUpperCase().concat(str.substring(1, str.length));
};

export const activityToCn = (activity) => {
  if (!activity) return null;
  if (activity < 0.25) return "cube-color-1";
  if (activity < 0.5) return "cube-color-2";
  if (activity < 0.75) return "cube-color-3";
  return "cube-color-4";
};

export const activityToString = (yesCount, day, month) => {
  return `${yesCount === 0 ? "No" : yesCount} ${
    yesCount === 1 ? "habit" : "habits"
  } on ${day} ${capitalize(month)}`;
};

export const months = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

export const calculateActivityFromRow = (row) => {
  let yesCount = 0;
  const keys = Object.keys(row);
  keys.forEach((key) => {
    if (row[key] === "Yes") {
      yesCount = yesCount + 1;
    }
  });
  const allKeys = keys.length - 1; // minus 1 because "day" field have to be omitted
  return {
    yesCount,
    fraction: Number(parseFloat(yesCount / allKeys).toPrecision(1)),
  };
};

export const getDateFromFilename = (filename) => {
  const date = filename.split(".")[0];
  const [month, year] = date.split("_");
  return {
    month,
    year,
  };
};
