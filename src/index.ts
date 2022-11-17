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
  const startTime = req.query.startTime||10;
  const endTime = req.query.endTime||11;
  const day = req.query.day||"sun";
  
  const sections = await sectionRepo.createQueryBuilder("section")
  .where(`days like '%${day}%'`).getMany();
  const freeHalls = getFreeAtTime(Number(startTime),Number(endTime),sections);

  console.log(freeHalls.length);
  res.json(freeHalls);
})

function getFreeAtTime(startTime:number,endTime:number, sections:Section[]){
  const set = new Set<string>(sections.map(section=>section.hall));

  const freeHalls:string[] = [];
  for(const hall of set){
    if(hallIsFree(hall,startTime,endTime,sections)){
      freeHalls.push(hall);
    }
  }
  
  return freeHalls;
}

function hallIsFree(hall:string,startTime:number,endTime:number, sections:Section[]){

  for(const section of sections){
      if(section.hall == hall && (section.startTime >= startTime && section.startTime < endTime || section.endTime > startTime && section.endTime <= endTime)){
        console.log(hall)
        console.log(section);
        console.log("====================================");
        return false;
      }
  }
    return true;
}

app.listen(PORT, () => console.log(`server running on port ${PORT}`));


