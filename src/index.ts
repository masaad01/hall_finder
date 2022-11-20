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
  console.time("getFreeAtTimeN");
  const freeHalls = getFreeAtTimeN(Number(startTime),Number(endTime),sections);
  console.timeEnd("getFreeAtTimeN");

  console.log(freeHalls.length);
  res.json(freeHalls);
})


function getFreeAtTimeN(startTime:number,endTime:number, sections:Section[]){
    const myMap = new Map<string,boolean>();
    sections.forEach(section=>{
      if(myMap.has(section.hall)&&myMap.get(section.hall)&& !hallIsFree(startTime,endTime,section)){
        myMap.set(section.hall,false);
      }
      else{
        if(hallIsFree(startTime,endTime,section)){
          myMap.set(section.hall,true);
        }
        else{
          myMap.set(section.hall,false);
        }
      }
      
    })
    const freeHalls:string[] = [];
    myMap.forEach((value,key)=>{
      if(value){
        freeHalls.push(key);
      }
    })
    return freeHalls;

}

function hallIsFree(startTime:number,endTime:number,section :Section){
  const sectionIsNotFree =  (section.startTime >= startTime && section.startTime < endTime || section.endTime > startTime && section.endTime <= endTime)
  return !sectionIsNotFree;
}

app.listen(PORT, () => console.log(`server running on port ${PORT}`));

