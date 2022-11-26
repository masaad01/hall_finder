import { AppDataSource, sectionRepo } from "./config/DataSource";
import cors from 'cors'
import express, { Express } from "express";
import path from 'path'
import { Section } from "./entity/Section";
import e from "cors";

AppDataSource.initialize()
  .then(() => { console.log("db connected") })
  .catch((err) => console.log(err));
const app: Express = express();
const PORT = process.env.PORT || 3000

  ;

app.use(express.json());
app.use(cors())

app.get('/', async (req, res) => {
  const CLOSE_TIME = 20;
  const MAX_WAIT_TIME = 15 / 60; // 15 minutes (until hall free)
  const time = req.query.time || "12:00";
  const day = req.query.day || "sun";
  const sections = await sectionRepo.createQueryBuilder("section")
    .where(`days like '%${day}%'`).getMany();
  console.time("getFreeAtTimeN");
  const freeHalls = getFreeAtTimeN(timeFromString(String(time)), sections, MAX_WAIT_TIME);
  console.timeEnd("getFreeAtTimeN");

  console.log(freeHalls.size);
  const sorted = [...freeHalls.entries()].sort((a, b) => b[1] - a[1]);

  const result = sorted.map(([hall, freeDuration]) => {
    // if (freeDuration === Infinity) {
    //   freeDuration = CLOSE_TIME - timeFromString(String(time));
    // }
    return {
      hall,
      freeDuration: timeToString(freeDuration) === "Invalid time" ? "for the rest of the day" : timeToString(freeDuration),
    };
  });

  res.json(result);
})


function getFreeAtTimeN(time: number, sections: Section[], maxWaitTime = 0) {
  const myMap = new Map<string, number>();
  sections.forEach(section => {
    const freeDuration = hallFreeDuration(time, section);
    if (myMap.has(section.hall)) {
      myMap.set(section.hall, Math.min(myMap.get(section.hall)!, freeDuration));
    }
    else {
      myMap.set(section.hall, freeDuration);
    }
  })
  const freeHalls = new Map<string, number>();
  myMap.forEach((value, key) => {
    if (value >= -maxWaitTime) {
      freeHalls.set(key, value);
    }
  })
  return freeHalls;
}

function hallFreeDuration(time: number, section: Section) {
  if (section.startTime > time) {
    return section.startTime - time;
  }
  if (section.endTime <= time) {
    return Infinity;
  }
  return time - section.endTime;
}

function timeToString(time: number) {
  // time format: hh:mm
  // check if time is valid
  if (time < 0 || time > 24) {
    return "Invalid time";
  }
  const hours = Math.floor(time);
  const minutes = Math.round((time - hours) * 60);
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

function timeFromString(time: string) {
  // time format: hh:mm
  // check if time is valid
  if (!time.match(/^\d{2}:\d{2}$/)) {
    return -1;
  }
  const [hours, minutes] = time.split(":").map(Number);
  return hours + minutes / 60;
}

app.listen(PORT, () => console.log(`server running on port ${PORT}`));

