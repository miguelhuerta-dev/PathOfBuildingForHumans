interface UpgradeCardProps {
  title: string;
  description: string;
  dpsIncrease: number;
  ehpIncrease: number;
}

function UpgradeCard({
  title,
  description,
  dpsIncrease,
  ehpIncrease,
}: UpgradeCardProps) {
  return (
    <div className="bg-slate-900 border border-amber-700 rounded-2xl p-5">

      <p
        className="
        text-xs
        uppercase
        tracking-widest
        text-amber-500
        text-center
        mb-2
        ">
        
        Rare Item

        
      </p>




      <h3 className="
      text-amber-300
      text-xl
      font-bold
      text-center
      "
      >
        {title.toUpperCase()  }
      </h3>


      <p className="text-center
      text-slate-300 mt-3-">
        {description}
      </p>

    
      <div className="flex 
      justify-center gap-6 mt-42">  
        <span className="text-
        emerald-400">
          +{dpsIncrease}% DPS
        </span>

        <span className="text-
        sky-400">
          +{ehpIncrease}% EHP
        </span>



      
      </div>
    </div>
  );
}

export default UpgradeCard;