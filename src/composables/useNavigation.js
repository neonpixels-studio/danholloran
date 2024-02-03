import { computed } from "vue";
import { useRoute } from "vitepress";
import {
  CodeBracketIcon,
  CameraIcon,
  MegaphoneIcon,
  EnvelopeIcon,
} from "@heroicons/vue/24/outline";
import {
  CameraIcon as CameraIconSolid,
  MegaphoneIcon as MegaphoneIconSolid,
  EnvelopeIcon as EnvelopeIconSolid,
} from "@heroicons/vue/24/solid";
import GithubIcon from "@/assets/images/github-icon.svg";
import LinkedinIcon from "@/assets/images/linkedin-icon.svg";
import SpotifyIcon from "@/assets/images/spotify-icon.svg";
import InstagramIcon from "@/assets/images/instagram-icon.svg";
import XIcon from "@/assets/images/x-icon.svg";
import YoutubeIcon from "@/assets/images/youtube-icon.svg";

const useNavigation = () => {
  const primaryNavigationItems = computed(() => {
    const isPostsActive = isActiveNavigationItem("/posts");
    const isProjectsActive = isActiveNavigationItem("/projects");
    const isPhotosActive = isActiveNavigationItem("/photos");
    const isContactActive = isActiveNavigationItem("/contact");

    return [
      // {
      //   label: "Posts",
      //   link: "/posts",
      //   icon: isPostsActive ? MegaphoneIconSolid : MegaphoneIcon,
      // },
      // {
      //   label: "Projects",
      //   link: "/projects",
      //   icon: CodeBracketIcon,
      // },
      // {
      //   label: "Photos",
      //   link: "/photos",
      //   icon: isPhotosActive ? CameraIconSolid : CameraIcon,
      // },
      {
        label: "Contact",
        link: "#contact",
        icon: isContactActive ? EnvelopeIconSolid : EnvelopeIcon,
      },
    ];
  });

  const socialNavigationItems = computed(() => {
    return [
      {
        label: "LinkedIn",
        link: "https://www.linkedin.com/in/dan-holloran/",
        icon: LinkedinIcon,
      },
      {
        label: "Github",
        link: "https://github.com/DHolloran/",
        icon: GithubIcon,
      },
      {
        label: "X",
        link: "https://twitter.com/DHolloran",
        icon: XIcon,
      },
      {
        label: "Spotify",
        link: "https://open.spotify.com/user/dholloran",
        icon: SpotifyIcon,
      },
      {
        label: "Instagram",
        link: "https://www.instagram.com/dholloran85/",
        icon: InstagramIcon,
      },
      {
        label: "YouTube",
        link: "https://www.youtube.com/DanHolloran",
        icon: YoutubeIcon,
      },
    ];
  });

  const isActiveNavigationItem = (link) => {
    const route = useRoute();

    if (link === "/") {
      return route.path === link;
    }

    return route.path.includes(link);
  };

  return {
    primaryNavigationItems,
    socialNavigationItems,
    isActiveNavigationItem,
  };
};

export default useNavigation;
