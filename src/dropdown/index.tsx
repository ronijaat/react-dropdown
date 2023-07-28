import React, { useEffect, useRef, useState } from "react";
import { CmUtils, Hooks, HtmlUtils } from "@delpi/common";
import Scrollbar2 from "react-perfect-scrollbar-z";
import "./styles.scss";

export interface IGroupData {
  isGroup: boolean;
  groupName: string | React.ReactNode;
  className?: string;
  items: any[];
}

export interface IDropdownProps {
  className?: string;
  arrowClassName?: string;
  groupItemClassName?: string;
  dropdownClassName?: string;
  placeholderClassName?: string;
  showTop?: boolean;
  options: any[];
  keyName?: string;
  labelName?: string;
  value?: string | number | null;
  customizeArrow?: string | React.ReactNode;
  placeholder?: string;
  noDataMessage?: string;
  width?: string | number;
  height?: string | number;
  fullWidth?: boolean;
  perfectScroll?: boolean; // option support perfectscrollbar
  tabIndex?: number;
  disabled?: boolean;
  heightDropdown?: string | number;
  fitWHeight?: boolean;
  autoDirection?: boolean; // auto change dropdown (showTop) if height is small
  open?: boolean; // no need
  keepScrollPosition?: boolean;
  resizeClose?: boolean;
  escClose?: boolean;
  onSelection?: (value: string | number | null, selectItem?: any) => any;
  onShown?: () => void; // no need
  onHidden?: () => void; // no need
}

const Dropdown: React.FC<IDropdownProps> = ({
  className,
  arrowClassName,
  groupItemClassName,
  dropdownClassName,
  placeholderClassName,
  showTop = false,
  options,
  keyName = "",
  labelName = "",
  value = "",
  customizeArrow,
  placeholder = "-- Select --",
  noDataMessage = "No option",
  width = "100%",
  height = "40px",
  fullWidth = true,
  perfectScroll,
  tabIndex = -1,
  disabled,
  // duration = 500,
  heightDropdown,
  fitWHeight = true,
  autoDirection = true,
  open,
  keepScrollPosition = true,
  resizeClose = true,
  escClose = true,
  onSelection = () => {},
  onShown = () => {},
  onHidden = () => {},
}) => {
  const resize = Hooks.useWindowSize();

  const refsButton = useRef<any>(null!);
  const refsBasicDropdown = useRef<any>(null!);
  // const refsScroll = useRef<any>(null!);

  const [isShow, setShow] = useState<boolean>(false);
  const [localValue, setLocalValue] = useState<string | number | null>(null);
  const [localLabel, setLocalLabel] = useState<any>(null);
  const [currentScroll, setCurrentScroll] = useState<number | null>(null);
  const [clientMaxHeight, setClientMaxHeight] = useState<any>(null);

  const hasKey = typeof keyName === "string" && keyName.trim() !== "";
  const hasOpts = Array.isArray(options) && options.length > 0;

  // active hide if need
  useEffect(() => {
    let show = Boolean(open);
    !show && setClientMaxHeight(null);
    setShow(show);
  }, [open]);

  // if you want reset value
  useEffect(() => {
    let itemData = options.find((item) => getSelectedValue(item) === value);
    if (itemData) {
      setLocalLabel(displayObjectLabelName(itemData));
      setLocalValue(getSelectedValue(itemData));
      return;
    }
    setLocalLabel(null);
    setLocalValue(null);
  }, [value]);

  // resize screen
  useEffect(() => {
    resizeClose && isShow && beforeHide();
  }, [resize]);

  Hooks.useEventListener("scroll", () => beforeHide());
  // Hooks.useEventListener("wheel", () => setShow(false))

  Hooks.useEventListener("keydown", (e) => {
    if (escClose && e.key === "Escape") {
      beforeHide();
    }
  });

  Hooks.useOutsideClick(refsButton, () => beforeHide());

  const beforeHide = () => {
    setClientMaxHeight(null);
    setShow((pre) => {
      pre && onHidden();
      return false;
    });
  };

  const displayObjectLabelName = (value: any) => {
    if (!hasKey) {
      return value;
    }
    if (!CmUtils.isNil(value[labelName])) {
      return value[labelName];
    }
    if (!CmUtils.isNil(value[keyName])) {
      return value[keyName];
    }
    return JSON.stringify(value);
  };

  const handleToggleClick = () => {
    if (!hasOpts) {
      return;
    }
    setShow(!isShow);

    if (!isShow) {
      onShown();
      return;
    }
    onHidden();
    setClientMaxHeight(null);
  };

  const getSelectedValue = (value: any) => {
    if (!hasKey) {
      return value;
    }

    if (!CmUtils.isNil(value[keyName])) {
      return value[keyName];
    }

    return JSON.stringify(value);
  };

  const handleSelect = (value: any) => {
    let selectedValue = getSelectedValue(value);

    setLocalLabel(displayObjectLabelName(value));
    setLocalValue(selectedValue);

    onSelection(selectedValue, value);
    setShow(false);
    setClientMaxHeight(null);
  };

  const handleRefScroll = (el: any) => {
    if (el instanceof Element) {
      keepScrollPosition &&
        setTimeout(() => {
          el.querySelector(".scroll-content").scrollTop = currentScroll || 0;
        });

      if (!fitWHeight) {
        return;
      }

      let { bottom, top, height } = refsButton.current.getBoundingClientRect();

      let minHeight = height * 2 + 4;
      let topHeight = Math.round(top) - 8;
      let bottomHeight = Math.round(window.innerHeight - bottom) - 8;
      let maxHeightSize = !showTop ? bottomHeight : topHeight;

      let currentHeight = el.clientHeight;

      if (!autoDirection) {
        // check real height with screen
        if (currentHeight > maxHeightSize) {
          currentHeight = maxHeightSize;
          setClientMaxHeight(`${currentHeight}px`);
        }

        if (showTop) {
          // @ts-ignore
          el.style.top = `${-currentHeight - 4}px`;
        } else {
          // el.style.top = `${refsButton.current?.offsetHeight + 4}px`
        }
        return;
      }

      // remove over screen
      if (currentHeight > maxHeightSize) {
        currentHeight = maxHeightSize;
      }

      if (currentHeight < minHeight) {
        // move bottom to show top
        if (!showTop) {
          // @ts-ignore
          el.style.top = `${-el.clientHeight - 4}px`;
          maxHeightSize = topHeight;
        } else {
          // default is bottom.
          maxHeightSize = bottomHeight;
        }

        // check again after change direction
        currentHeight = el.clientHeight;
        if (currentHeight > maxHeightSize) {
          currentHeight = maxHeightSize;
        }
      } else {
        //e nough height
        if (showTop) {
          // @ts-ignore
          el.style.top = `${-currentHeight - 4}px`;
        }
      }
      setClientMaxHeight(`${currentHeight}px`);
    }
  };

  return (
    <div
      ref={refsButton}
      className={HtmlUtils.joinClass("dp-dropdown2-container", className)}
      style={{ width: fullWidth ? width : "auto", height }}
    >
      <button
        className={HtmlUtils.joinClass(
          "dropdown2-button",
          !hasOpts && "dropdown2-button-nodata"
        )}
        disabled={disabled}
        onClick={handleToggleClick}
        aria-haspopup="listbox"
      >
        {!hasOpts ? (
          <span className="dropdown2-label dropdown2-no-message">
            {noDataMessage}
          </span>
        ) : CmUtils.isNil(localValue) ? (
          <span
            className={HtmlUtils.joinClass(
              "dropdown2-label dropdown2-placeholder",
              placeholderClassName
            )}
          >
            {placeholder}
          </span>
        ) : (
          <span className="dropdown2-label dropdown2-selected">
            {localLabel}
          </span>
        )}
        <span className="dropdown2-anything"></span>
        <span
          className={HtmlUtils.joinClass(
            "dropdown2-arrow",
            arrowClassName,
            isShow && "dropdown2-arrow-active"
          )}
        >
          {customizeArrow}
        </span>
      </button>

      {isShow && (
        // <CSSTransition
        //   in={isShow}
        //   timeout={duration}
        //   classNames="dropdown2-transition"
        // >
        <div
          // handle refElement
          ref={handleRefScroll}
          tabIndex={tabIndex}
          className={HtmlUtils.joinClass(
            "dropdown2-list-items",
            dropdownClassName
          )}
          style={{
            top: refsButton.current?.offsetHeight + 4,
            width: fullWidth ? refsButton.current.offsetWidth : "auto",
          }}
          aria-expanded="true"
        >
          {perfectScroll ? (
            // @ts-ignore
            <Scrollbar2
              style={{ maxHeight: clientMaxHeight || heightDropdown }}
              effectData={[
                options,
                heightDropdown,
                fitWHeight,
                autoDirection,
                showTop,
              ]}
              always
              wheelStop={false}
              onScrollY={(evt: any) => {
                keepScrollPosition && setCurrentScroll(evt.target.scrollTop);
              }}
            >
              <DropdownListItem />
            </Scrollbar2>
          ) : (
            <div
              ref={refsBasicDropdown}
              className="dropdown2-list-default scroll-content"
              style={{ maxHeight: clientMaxHeight || heightDropdown }}
              onScroll={(evt: any) => {
                keepScrollPosition && setCurrentScroll(evt.target.scrollTop);
              }}
            >
              <DropdownListItem />
            </div>
          )}
        </div>
        // </CSSTransition>
      )}
    </div>
  );

  // =======================================================================
  // =======================================================================
  // =======================================================================
  function DropdownListItem() {
    return (
      <>
        {options.map((data, index) => {
          if (data.isGroup) {
            return (
              <React.Fragment key={index}>
                <div
                  className={HtmlUtils.joinClass(
                    "dropdown2-group-item",
                    groupItemClassName,
                    data.className
                  )}
                >
                  {data.groupName}
                </div>

                {data.items.map((sub: any, idx: number) => {
                  return <DropDownItem key={idx} item={sub} />;
                })}
              </React.Fragment>
            );
          }

          return <DropDownItem key={index} item={data} />;
        })}
      </>
    );
  }

  function DropDownItem({ item }: { item: any }) {
    const isSelected = getSelectedValue(item) === localValue;
    return (
      <div
        tabIndex={tabIndex}
        className={HtmlUtils.joinClass(
          "dropdown2-item",
          isSelected && "dropdown2-item-selected",
          item.className,
          item.disabled && "dropdown2-item-disabled"
        )}
        onClick={(evt) => {
          evt.preventDefault();
          !item.disabled && handleSelect(item);
        }}
        onTouchEnd={(evt) => {
          evt.preventDefault();
          !item.disabled && handleSelect(item);
        }}
        role="option"
        aria-selected={isSelected ? "true" : "false"}
      >
        <p>{displayObjectLabelName(item)}</p>
      </div>
    );
  }
};

export default Dropdown;
