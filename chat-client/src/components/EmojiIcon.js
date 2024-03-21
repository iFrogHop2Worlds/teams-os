import Image from "next/image"

export const EmojisBarIcon = () => {
    return (
    <>
        <Image loading="lazy" src={"/images/emoji_icon.png"} alt={"emoji bar icon"} height={100} width={100} className="rounded-full h-12 w-12 cursor-pointer"></Image>
    </>
    )
}