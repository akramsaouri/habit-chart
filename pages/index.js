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

export default function Home({ reports, meta }) {
  return (
    <>
      <Head>
        <title>Habit Chart</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <ReactTooltip backgroundColor="rgb(51,51,51)" effect="solid" />
      <div className={styles.container}>
        <div>
          <h1 className={styles.title}>
            <span>
              <svg
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="4"
                viewBox="0 0 24 24"
              >
                <path d="M12 20L12 10"></path>
                <path d="M18 20L18 4"></path>
                <path d="M6 20L6 16"></path>
              </svg>
            </span>
            <span>Habits Chart</span>
          </h1>
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
                <span className={styles.monthName}>
                  {capitalize(report.meta.date.month)}
                </span>
              </div>
            ))}
          </div>
          <p className={styles.subtitle}>
            {meta.totalYesCount} habits in {meta.year}
          </p>
        </div>
      </div>
    </>
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
  let totalYesCount = 0;
  const reports = filenames.map((filename) => {
    const csvFilePath = path.join(dataCsvDirectory, filename);
    const dataCsvFile = fs.readFileSync(csvFilePath, "utf8");
    const parsedCsv = papa.parse(dataCsvFile, { header: true });
    const report = parsedCsv.data.map((row) => {
      const activity = calculateActivityFromRow(row);
      totalYesCount += activity.yesCount;
      return {
        day: row[Object.keys(row)[0]], // TODO: fix this
        activity,
      };
    });
    return {
      id: filename,
      data: report,
      meta: {
        date: getDateFromFilename(filename),
        fields: parsedCsv.meta.fields,
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
      meta: {
        totalYesCount,
        year: 2020, // TODO: make is dyanmic once we have more data for this year
      },
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
