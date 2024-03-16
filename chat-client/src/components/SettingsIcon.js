import Image from "next/image"

export const SettingsIcon = () => {
    return (
    <>
        <Image loading="lazy" src={"/images/settingsIcon.svg"} alt={"settings"} height={125} width={125} className="bg-white rounded-full h-12 w-12 hover:bg-slate-400 cursor-pointer"></Image>
    </>
    )
}