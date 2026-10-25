export class AdminRequestError extends Error { constructor(message:string,public status:number){super(message);} }
export async function adminRequest<T>(url:string,init?:RequestInit):Promise<T>{
  const response=await fetch(url,{...init,cache:'no-store'});
  const data=await response.json().catch(()=>({error:'We could not complete that request. Please try again.'}));
  if(!response.ok)throw new AdminRequestError(response.status===401?'Your session has ended. Sign in again to continue.':response.status===403?'This account does not have administrator access.':data.error||'Please try again.',response.status);
  return data as T;
}
export function errorMessage(cause:unknown){return cause instanceof Error?cause.message:'Something went wrong. Please try again.';}
export function savedDate(timestamp:number){return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(timestamp);}
export function contentChanged(draft:unknown,published:unknown){return JSON.stringify(draft)!==JSON.stringify(published);}
