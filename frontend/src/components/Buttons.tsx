import { div } from "framer-motion/client";


function Button1 (){
    const buttons = [];

    const handleclick = (ind) =>{
        console.log(`Button ${ind + 1}`)
    };
    for(let i = 0 ;i < 50;i++){
        let text= `Button ${i}`;

        buttons.push(
            <div><button key={i} className="border-2 " onClick={()=> handleclick(i)}>
                {text}
            </button>
            <br/>
        </div>)
            
    }

    return(
        <div>
            {buttons}
        </div>
    )
}

export default Button1;