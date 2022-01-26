import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import fs from "fs";
import path from "path";
import papa from "papaparse";
import cn from "classnames";
import Head from "next/head";
import ReactTooltip from "react-tooltip";
import { decrypt } from "folder-encrypt";

import {
    activityToCn,
    activityToString,
    getDateFromFilename,
    months,
    calculateActivityFromRow,
    capitalize,
} from "../utils";
import { availableYears } from "../config";
import styles from "../styles/Home.module.css";

export default function Home({ reports, meta }) {
    const [selectedTheme, setSelectedTheme] = useState("green");
    const [selectedYear, setSelectedYear] = useState(meta.year);
    const [isMounted, setIsMounted] = useState(false);
    const router = useRouter();

    const setCssVarProperty = (name, value) => {
        document.documentElement.style.setProperty(name, value);
    };

    useEffect(() => {
        if (selectedYear !== meta.year) {
            // no need to redirect on ssr
            router.push(`/${selectedYear}`);
        }
    }, [selectedYear]);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        ReactTooltip.rebuild();
    }, [meta.year]);

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
            {isMounted && (
                <ReactTooltip
                    id={selectedYear}
                    backgroundColor="rgb(51,51,51)"
                    effect="solid"
                />
            )}
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
                            <div
                                key={report.id}
                                className={styles.monthContainer}
                            >
                                <div className={styles.activityGrid}>
                                    {report.data.map((row) => (
                                        <span
                                            key={row.day}
                                            className={cn(
                                                styles.cube,
                                                styles[
                                                    activityToCn(
                                                        row.activity.fraction
                                                    )
                                                ]
                                            )}
                                            onClick={() =>
                                                console.log(
                                                    activityToString(
                                                        row.activity.yesCount,
                                                        row.day,
                                                        report.meta.date.month
                                                    )
                                                )
                                            }
                                            data-tip={activityToString(
                                                row.activity.yesCount,
                                                row.day,
                                                report.meta.date.month
                                            )}
                                            data-for={selectedYear}
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
                            <span>{meta.totalYesCount} habits in</span>
                            <select
                                value={selectedYear}
                                onChange={(e) =>
                                    setSelectedYear(e.target.value)
                                }
                                className={styles.yearPicker}
                            >
                                {meta.availableYears.map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
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

export async function getStaticProps({ params }) {
    const { year } = params;
    const encryptedDataCsvDirectory = path.join(
        process.cwd(),
        "/data.encrypted"
    );
    await decrypt({
        input: encryptedDataCsvDirectory,
        password: process.env.ENCRYPT_PASS,
    });
    const dataCsvDirectory = path.join(process.cwd(), "/data");
    let filenames = fs.readdirSync(dataCsvDirectory);
    // filter filenames for year param
    const shortYear = year.slice(2, 4);
    filenames = filenames.filter((filename) => {
        return filename.endsWith(`_${shortYear}.csv`);
    });
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
                year,
                availableYears,
            },
        },
    };
}

export async function getStaticPaths() {
    const paths = availableYears.map((year) => ({
        params: {
            year,
        },
    }));
    return {
        paths,
        fallback: false,
    };
}
