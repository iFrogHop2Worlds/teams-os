import Image from "next/image"

export const SettingsIcon = () => {
    return (
    <>
        <Image loading="lazy" src={"/images/settingsIcon.svg"} alt={"settings"} height={100} width={100} className="bg-white rounded-full h-12 w-12 hover:bg-slate-400 cursor-pointer"></Image>
    </>
    )
}