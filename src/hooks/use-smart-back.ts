import { useNavigate } from "react-router-dom";

export const useSmartBack = (fallbackPath: string = "/appview") => {
  const navigate = useNavigate();

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  };

  return goBack;
};
