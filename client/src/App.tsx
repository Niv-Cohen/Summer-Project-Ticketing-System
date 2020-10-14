import React from 'react';
import './App.scss';
import {createApiClient, Ticket, ticketsSet} from './api';

export type AppState = {
	tickets?: Ticket[],
	search: string;
	hiddenArray:string[];
	seeMoreArr:string[];
	page:number;
	hasNext:boolean
	ticketSet?:ticketsSet
	isOnFavePage:boolean,
	favTickets:string[]
}

const api = createApiClient();
export class App extends React.PureComponent<{}, AppState> {
	state: AppState = {
		search: '',
		isOnFavePage:false,
		page:1,
		hasNext:true,
		favTickets:[],
		hiddenArray:[],
		seeMoreArr:[]
	}
	//return hide button which when clicked hides the ticket associated with the button
	 toggleHideButton = (ticketId:string)=>{
		return(<button className='hide' onClick={()=> this.setState({hiddenArray:this.state.hiddenArray.concat([ticketId])})}>Hide</button>)
	}
	//change search mode-favoriteTickets/allTickets
	toggleIsOnFavMode = ()=>{
			if(!this.state.isOnFavePage)
				return (<span className="fa fa-star star upperStar" onClick={()=>this.setState({isOnFavePage:true,page:1})}></span>)
			else
				return (<span className="fa fa-star star checkedStar upperStar" onClick={()=>this.setState({isOnFavePage:false,page:1})}></span>)
	}
	 //After a star was clicked, add it to my favorites 
	toggleTicketFaveButton = (ticketId:string)=>{
		if(!this.state.favTickets.includes(ticketId))
			return(<span className="fa fa-star star" onClick={()=>this.setState({favTickets:this.state.favTickets.concat(ticketId)})}></span>)
		else
			return(<span className="fa fa-star star checkedStar" onClick={()=>this.setState({favTickets:this.state.favTickets.filter((id)=>id!==ticketId)})}></span>)
}

	//change content mode -someContent/AllContent
	toggleContentView= (ticket:Ticket)=>{
		if(!this.state.seeMoreArr.includes(ticket.id))
			return (<div className='content-hidden'>{ticket.content}</div>);
		else
			return (<div className='content-fullView'>{ticket.content}</div>)
	}
	//restore all hidden tickets
	restoreHiddenTickets=()=>{this.setState({hiddenArray:[]})}
	
	//change mode-seeMore/seeLess -if there are over than 400 chars add SeeMore Button
	toggleSeeMore = (ticketId:string,content:string)=>{
		if(content.length<400)
			return null;
		if(!this.state.seeMoreArr.includes(ticketId)){
			return (<button className='seeMore' onClick={()=>this.setState({seeMoreArr:this.state.seeMoreArr.concat(ticketId)})}>See more</button>)
		}
		else
			return (<button className='seeMore' onClick={()=>this.setState({seeMoreArr:this.state.seeMoreArr.filter((id)=>id!==ticketId)})}>See Less</button>)
	}

	//returns the relavent text according to how many tickets are shown
	 hiddenTicketsString=(ticketsNum:number)=>{
		let headerString=<div className='results'>Showing {ticketsNum} results</div>;
		let arrayLen:number=this.state.hiddenArray.length;
		let ticketSyntax:string="ticket";
		if(arrayLen>1)
			ticketSyntax+="s";
		if(arrayLen!==0)
			headerString=<div className='results'>Showing {ticketsNum} results
			({arrayLen} hidden {ticketSyntax} -<button className='restore' onClick={this.restoreHiddenTickets}>restore</button>)</div>
			return(headerString);
	 }
	 //return the page number and the arrows according to the reamining data in the server side
	pageNumber=()=>{
  		 let prevPage=null;
		 let currPage:number=this.state.page;
		 let nextPage;
		 if(this.state.hasNext)
			nextPage=<button className="pageArrows next round" onClick={this.goToNextPage}>&#8250;</button>
		 if(this.state.page>1)
			 prevPage=<button className="pageArrows previous round" onClick={this.goToPrevPage}>&#8249;</button>
		return ( <div className='pageButtons'>{prevPage}{currPage}{nextPage}</div>)
	 }
	 //go the the prev page 
	goToPrevPage=()=>{this.setState({hasNext:true,page:this.state.page-1})}
	 //go to next page
	goToNextPage=()=>{
		this.setState({page:this.state.page+1});
	}
	searchDebounce: any = null;

	async componentDidMount() {
		const res=await api.getTickets(this.state.page,this.state.search,this.state.isOnFavePage,this.state.favTickets);
		this.setState({tickets:res.tickets,hasNext:res.hasNext});
	}
    //every time a state has been changed ,pull the relavent data from server
	async componentDidUpdate(prevProps:any,prevState:any){
		const {page,isOnFavePage,favTickets,search}=this.state
		 if((prevState.isOnFavePage!==isOnFavePage)||(prevState.page!==page)||(prevState.favTickets!==favTickets)||(prevState.search!==search))
			 await api.getTickets(this.state.page,this.state.search,this.state.isOnFavePage,this.state.favTickets).then((res)=>this.setState({tickets:res.tickets,hasNext:res.hasNext}))
		 
	}

	showLables=(ticket:Ticket)=>{
		return(<table><tr>{ticket.labels? ticket.labels.map((label)=><td className='lable'> {label} </td>):null}</tr></table>)
	}

	showFooter=(ticket:Ticket)=>{
		return(<footer><div className='meta-data'> By {ticket.userEmail} | { new Date(ticket.creationTime).toLocaleString()}</div></footer>)
	}

	showTicket=(ticket:Ticket)=>{
		return(<li key={ticket.id} className='ticket'>
		<h5 className='title'>{ticket.title}</h5>
		{this.toggleHideButton(ticket.id)}
		{this.toggleContentView(ticket)}
		{this.toggleSeeMore(ticket.id,ticket.content)}
		{this.showLables(ticket)}
		{this.toggleTicketFaveButton(ticket.id)}
		{this.showFooter(ticket)}			
		</li>)
	}
	//filter tickets
	renderTickets = (tickets: Ticket[]) => {
		const filteredTickets = tickets.filter((t) => !this.state.hiddenArray.includes(t.id));
		return (<ul className='tickets'>
			<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"></link>
				{filteredTickets.map((ticket) => this.showTicket(ticket))}
		</ul>
		);
	}

	onSearch = async (val: string, newPage?: number) => {
		
		clearTimeout(this.searchDebounce);

		this.searchDebounce = setTimeout(async () => {
			this.setState({
				search: val,
				page:1
			});
		}, 300);
	}

	 searchBar=()=>{
		return(<header><input type="search" placeholder="Search..." onChange={(e) => this.onSearch(e.target.value,this.state.page)}/></header>)
	 }

	render() {	
		const {tickets} = this.state;
		return (<main>
					<h1>Tickets List {this.toggleIsOnFavMode()}</h1> {this.pageNumber()}
					{this.searchBar()}
					{tickets ? this.hiddenTicketsString(tickets.length) : null }	
					{tickets ? this.renderTickets(tickets) : <h2>Loading..</h2>}
				</main>)
	}

}

export default App;