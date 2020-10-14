import axios from 'axios';

export type Ticket = {
	id: string,
	title: string;
	content: string;
	creationTime: number;
	userEmail: string;
	labels?: string[];
}

export type ApiClient = {
	getTickets: (page:number,searchVal:string,isOnFavePage:boolean,favTickets:string[]) => Promise<ticketsSet>;
}

export type ticketsSet = {
	tickets:Ticket[]
	hasNext:boolean
	
}


export const createApiClient = (): ApiClient => {
	return {
		getTickets: (page:number,searchVal:string,isOnFavePage:boolean,favTickets:string[]) => {
			return axios.get(`http://localhost:3232/api/tickets?`,{
			params:{
				page:page,
				searchVal:searchVal.toLocaleLowerCase(),
				favTickets:favTickets,
				isOnFavePage:isOnFavePage
			}}).then((res)=>res.data)
		}
	}
}



