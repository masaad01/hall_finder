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
  const startTime = req.query.startTime||0;
  const endTime = req.query.endTime||24;
  const day = req.query.day||"";
  
  const sections = await sectionRepo.createQueryBuilder("section")
  .where(`days like '%${day}%'`).getMany();
  const set = new Set<string>(sections.map(section=>section.hall));
  console.log(set.size)
  res.json(  getFreeAtTime(10,11,sections));
})

function getFreeAtTime(startTime:number,endTime:number, sections:Section[]){
  sections.forEach(section=>{
    if(section.hall==='g2120' && section.days.includes('wed')){
      console.log(section.startTime,section.endTime,section.days)
    }
  })
//     const mymap = new Map<string,boolean>();
//     sections.forEach(section=>{
//       if(mymap.has(section.hall)){
//         if(mymap.get(section.hall)){
//           if((section.startTime>=startTime && section.endTime<=endTime) ){
//             mymap.set(section.hall,false)
//           }
//         }
//       }else{
//         if((section.startTime>=startTime && section.endTime<=endTime) ){
//           mymap.set(section.hall,false)
//         }
//         else if(section.startTime>=endTime || section.endTime<=startTime){
//           mymap.set(section.hall,true)
//         }
//       }
//     })
//     const arr :string[]=[]
//     mymap.forEach((value,key)=>{console.log("value", value)})
// console.log(arr.length)
}

function hallIsFree(hall:string,startTime:number,endTime:number, sections:Section[]){
    
    sections.forEach(section=>{
        if(section.startTime>=startTime && section.endTime<=endTime && section.hall===hall){
            return false;
        }
    })
    return true;
}

app.listen(PORT, () => console.log(`server running on port ${PORT}`));


