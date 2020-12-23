import fs from "fs";
import path from "path";
import papa from "papaparse";
import cn from "classnames";
import Head from "next/head";
import ReactTooltip from "react-tooltip";

import styles from "../styles/Home.module.css";

const activityToCn = (activity) => {
  if (!activity) return null;
  if (activity < 0.25) return "cube--l1";
  if (activity < 0.5) return "cube--l2";
  if (activity < 0.75) return "cube--l3";
  return "cube--l4";
};

const capitalize = (str) => {
  return str.substring(0, 1).toUpperCase().concat(str.substring(1, str.length));
};

const activityToString = (yesCount, day, month) => {
  return `${yesCount === 0 ? "No" : yesCount} ${
    yesCount === 1 ? "habit" : "habits"
  } on ${day} ${capitalize(month)}`;
};

export default function Home({ reports }) {
  return (
    <div className={styles.container}>
      <Head>
        <title>Habit Chart</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <ReactTooltip backgroundColor="rgb(51,51,51)" effect="solid" />
      <div className={styles.yearContainer}>
        {reports.map((report) => (
          <div key={report.id} className={styles.monthContainer}>
            <div className={styles.activityGrid}>
              {report.data.map((row) => (
                <span
                  key={row.day}
                  className={cn(
                    styles.cube,
                    styles[activityToCn(row.activity.fraction)]
                  )}
                  data-tip={activityToString(
                    row.activity.yesCount,
                    row.day,
                    report.meta.date.month
                  )}
                />
              ))}
            </div>
            <span className={styles.monthName}>{report.meta.date.month}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export async function getStaticProps() {
  const months = [
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
  const dataCsvDirectory = path.join(process.cwd(), "/data");
  const filenames = fs.readdirSync(dataCsvDirectory);
  const reports = filenames.map((filename) => {
    const csvFilePath = path.join(dataCsvDirectory, filename);
    const dataCsvFile = fs.readFileSync(csvFilePath, "utf8");
    const data = papa.parse(dataCsvFile, { header: true });
    const report = data.data.map((row) => {
      return {
        day: row[Object.keys(row)[0]], // TODO: fix this
        activity: calculateActivityFromRow(row),
      };
    });
    return {
      id: filename,
      data: report,
      meta: {
        date: getDateFromFilename(filename),
        fields: data.meta.fields,
      },
    };
  });
  reports.sort((r1, r2) => {
    return months.indexOf(r1.meta.date.month) <
      months.indexOf(r2.meta.date.month)
      ? -1
      : 1;
  });
  return {
    props: {
      reports,
    },
  };
}

function calculateActivityFromRow(row) {
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
}

function getDateFromFilename(filename) {
  const date = filename.split(".")[0];
  const [month, year] = date.split("_");
  return {
    month,
    year,
  };
}
