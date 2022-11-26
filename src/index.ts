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
  const CLOSE_TIME = 20; // 8pm (close time)
  const MAX_WAIT_TIME = 15 / 60; // 15 minutes (until hall free)
  const time = req.query.time || "12:00"; // format: hh:mm
  const day = req.query.day || "sun"; // format: sun, mon, tue, wed, thu
  const sections = await sectionRepo.createQueryBuilder("section")
    .where(`days like '%${day}%'`).getMany();
  console.time("getFreeAtTimeN");
  const freeHalls = getFreeHallsAtTime(timeFromString(String(time)), sections, MAX_WAIT_TIME);
  console.timeEnd("getFreeAtTimeN");

  console.log(freeHalls.size);
  const sortedfreeHalls = [...freeHalls.entries()].sort((a, b) => b[1] - a[1]);

  const result = sortedfreeHalls.map(([hall, freeDuration]) => {
    if (freeDuration === Infinity) {
      freeDuration = 24;
    }
    return {
      hall,
      freeDuration: timeToString(freeDuration),
    };
  });

  res.json(result);
})


function getFreeHallsAtTime(time: number, sections: Section[], maxWaitTime = 0) {
  // time: number (in hours)
  // sections: Section[]
  // maxWaitTime: number (in hours)
  // return: Map<string, number> (key: hall, value: free duration (in hours))
  // if positive, then hall is free for that duration
  // else if negative, then hall is busy for that duration
  // if Infinity, then hall is free until close time
  // ** assumes sections are valid for that day
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
  // time: number (in hours)
  // section: Section
  // return: number (in hours)
  // if positive, then hall is free for that duration (relative to section)
  // else if negative, then hall is busy for that duration (relative to section)
  // if Infinity, then hall is free until close time (relative to section)
  // ** assumes section is valid for that day
  // ** all results are relative to section
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

