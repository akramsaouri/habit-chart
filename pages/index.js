import { useEffect, useState } from "react";
import fs from "fs";
import path from "path";
import papa from "papaparse";
import cn from "classnames";
import Head from "next/head";
import ReactTooltip from "react-tooltip";

import {
  activityToCn,
  activityToString,
  getDateFromFilename,
  months,
  calculateActivityFromRow,
  capitalize,
} from "../utils";
import styles from "../styles/Home.module.css";

export default function Home({ reports, meta }) {
  const [selectedTheme, setSelectedTheme] = useState("green");

  const setCssVarProperty = (name, value) => {
    document.documentElement.style.setProperty(name, value);
  };

  useEffect(() => {
    setCssVarProperty("--cube-color-1", `var(--${selectedTheme}-color-1)`);
    setCssVarProperty("--cube-color-2", `var(--${selectedTheme}-color-2)`);
    setCssVarProperty("--cube-color-3", `var(--${selectedTheme}-color-3)`);
    setCssVarProperty("--cube-color-4", `var(--${selectedTheme}-color-4)`);
  }, [selectedTheme]);

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
          <div className={styles.footer}>
            <p className={styles.summary}>
              {meta.totalYesCount} habits in {meta.year}
            </p>
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              className={styles.colorPicker}
            >
              <option value="green">Green</option>
              <option value="yellow">Yellow</option>
              <option value="orange">Orange</option>
              <option value="red">Red</option>
              <option value="blue">Blue</option>
            </select>
          </div>
        </div>
      </div>
    </>
  );
}

export async function getStaticProps() {
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
