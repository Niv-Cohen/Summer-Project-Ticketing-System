import express from 'express';

import bodyParser = require('body-parser');
import { tempData } from './temp-data';
import { Ticket, ticketsSet } from '@ans-exam/client/src/api';
import { threadId } from 'worker_threads';
import { nextTick } from 'process';

const app = express();

const PORT = 3232;

const PAGE_SIZE = 20;

app.use(bodyParser.json());

app.use((_, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', '*');
	res.setHeader('Access-Control-Allow-Headers', '*');
	next();
});
//return true if date of data is later than input's date
 let isAfterDate=(dateinput:string,dateOfData:string):boolean=>{
	let dateSplit=dateinput.split('/');
	let dateByNumbers1:number=+(dateSplit[2]+dateSplit[1]+dateSplit[0])
	dateOfData=dateOfData.slice(0,10);	
	dateSplit=dateOfData.split('/');
	let dateByNumbers2:number=+(dateSplit[2]+dateSplit[1]+dateSplit[0]);
	console.log(dateByNumbers2);
	return dateByNumbers2>dateByNumbers1;
}


app.get('/api/tickets', (req, res) => {
	const page:number = req.query.page;
	const searchBarVal:string=req.query.searchVal;
	let favTickets:string[]=req.query.favTickets;
	let isOnFavePage:string=req.query.isOnFavePage;
	let paginatedData:Ticket[]=tempData;
	let date:string;
	let searchKeyVal:string;	
		if(isOnFavePage.includes('true')){
		favTickets? paginatedData=paginatedData.filter((ticket:Ticket)=>favTickets.includes(ticket.id)):paginatedData=[];
		}
		if(searchBarVal.includes('after:')){
			date=searchBarVal.slice(6,16);
			searchKeyVal=searchBarVal.slice(16);
			if(searchBarVal.length>=16)
				paginatedData= paginatedData.filter((ticket:Ticket)=>isAfterDate(date,new Date(ticket.creationTime).toLocaleString())).filter((ticket:Ticket)=>ticket.title.toLowerCase().includes(searchKeyVal)).slice((page - 1) * (PAGE_SIZE), page * (PAGE_SIZE)+1)
		}
		else if(searchBarVal.includes('before:')){
			date=searchBarVal.slice(7,17);
			searchKeyVal=searchBarVal.slice(17);
			if(searchBarVal.length>=17)
				paginatedData= paginatedData.filter((ticket:Ticket)=>!isAfterDate(date,new Date(ticket.creationTime).toLocaleString())).filter((ticket:Ticket)=>ticket.title.toLowerCase().includes(searchKeyVal)).slice((page - 1) * (PAGE_SIZE), page * (PAGE_SIZE)+1)
		}
		else if(searchBarVal.includes('from:')){
			const fromEmail:string=searchBarVal.slice(5);
			paginatedData=paginatedData.filter((ticket:Ticket)=>ticket.userEmail.toLowerCase().includes(fromEmail)).slice((page - 1) * (PAGE_SIZE), page * (PAGE_SIZE)+1).slice((page - 1) * (PAGE_SIZE), page * (PAGE_SIZE)+1);
		}
		else if(searchBarVal.includes('lable:')){
			paginatedData=paginatedData.filter((ticket:Ticket)=> ticket.labels? ticket.labels.reduce((acc: boolean, cur: string) => acc = acc || searchBarVal.slice(6).split(',').includes(cur.toLocaleLowerCase()),false):false)
		}
		else
			paginatedData= paginatedData.filter((ticket:Ticket)=>ticket.title.toLowerCase().includes(searchBarVal)).slice((page - 1) * (PAGE_SIZE), page * (PAGE_SIZE)+1)
				
	//make sure there is another page
	const hasNext:boolean=paginatedData.length===21
	//if there is another page remove last ticket
	if(hasNext)
		paginatedData=paginatedData.slice(0,paginatedData.length-1)
	//create TicketSet object and send to client
	const t:ticketsSet={tickets:paginatedData,hasNext:hasNext}	
	res.send(t);
		
});

app.listen(PORT);
console.log('server running', PORT)

