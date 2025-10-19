import React from "react"
import {Virtuoso, VirtuosoHandle} from "react-virtuoso"
import {FilterOption, selectAllString} from "./SelectVirtualized"
import styles from "./VirtualizedSelect.module.scss"
import CheckIcon from '@patternfly/react-icons/dist/esm/icons/check-icon'

interface Props {
    isSearchable?: boolean,
    isSearching?: boolean,
    isMulti?: boolean,
    selectedDisplayText: string,
    options: FilterOption[],
    onOptionClick: (option: FilterOption) => void,
    isSelected: (option: FilterOption) => boolean,
    setShowMenu: (state: boolean) => void,
    selectedOptionsCount?: number
}

/**
 * Generates the "dropdown" menu for the options, including the search menu
 *
 * @param isSearchable  - optional boolean to add in search component
 * @param isSearching  - optional boolean to determine searching state
 * @param isMulti  - optional flag to render clearAll and selectAll
 * @param options  - required array of FilterOptions as items for the virtualized list
 * @param onOptionClick  - required callback to handle selection
 * @param isSelected  - required callback to check selection state for options
 * @param setShowMenu  - required callback to handle menu visibility state
 * @param selectedOptionsCount  - optional number of currently selected options
 * @returns {JSX.Element}
 */
export function DropdownMenu({
                                 isSearchable,
                                 isSearching,
                                 isMulti,
                                 options,
                                 onOptionClick,
                                 isSelected,
                                 setShowMenu,
                                 selectedOptionsCount
                             }: Props): JSX.Element {

    const ref = React.useRef<VirtuosoHandle | null>(null)
    const [currentItemIndex, setCurrentItemIndex] = React.useState(-1)
    const listRef = React.useRef<EventTarget | null>(null)

    // Determines the height for the option menu
    const dropdownHeight = (): number => {
        const baseOptionHeight = 40
        const maxOptionsToShow = 10
        return options.length < maxOptionsToShow ? options.length * baseOptionHeight : maxOptionsToShow * baseOptionHeight
    }

    // Callback to handle key input while focused on the options, stopPropagation is needed to keep focus
    const keyDownCallback = React.useCallback(
        (event: Event) => {
            const k = event as KeyboardEvent
            let nextIndex: number | null = null
            k.preventDefault()
            k.stopPropagation()

            if (k.code === 'ArrowUp') {
                nextIndex = Math.max(0, currentItemIndex - 1)
            } else if (k.code === 'ArrowDown') {
                nextIndex = Math.min(options.length - 1, currentItemIndex + 1)
            } else if (k.code === 'Enter' || k.code === 'Space') {
                if (currentItemIndex >= 0 && currentItemIndex < options.length) {
                    onOptionClick(options[currentItemIndex])
                }
            } else if (k.code === 'Escape') {
                setShowMenu(false)
            }

            if (nextIndex !== null) {
                const index = nextIndex
                ref.current?.scrollIntoView?.({
                    index,
                    behavior: 'auto',
                    done: () => {
                        setCurrentItemIndex(index)
                    },
                })
            }
        },
        [currentItemIndex, onOptionClick, options, setShowMenu]
    )

    const scrollerRef = React.useCallback(
        (element: HTMLElement | Window | null) => {
            if (element) {
                ;(element as EventTarget).addEventListener('keydown', keyDownCallback as EventListener)
                listRef.current = element as EventTarget
            } else {
                if (listRef.current) {
                    listRef.current.removeEventListener('keydown', keyDownCallback as EventListener)
                    listRef.current = null
                }
            }
        },
        [keyDownCallback]
    )

    return (
        <div className={`${styles.eiFilterDropdownMenu} ${!(isSearchable) && styles.eiNoSearchDropdownItem}`}>
            {((isMulti && options.length > 1) || (!isMulti && options.length > 0)) ? <Virtuoso
                role={"menu"}
                ref={ref}
                style={{height: dropdownHeight(), outline: currentItemIndex === -1 ? "inset 1px solid blue" : "none"}}
                totalCount={options.length}
                data={options}
                className={`${styles.eiDropdownScroller} ${!(isSearchable) && styles.eiNoSearchDropdown}`}
                scrollerRef={scrollerRef}
                itemContent={(index, option) => (
                    <>
                        {option.value === selectAllString && !isSearching && <div
                            role={"menuitem"}
                            key={option.value}
                            onClick={() => {
                                onOptionClick(option);
                                if (!isMulti) {
                                }
                            }}
                            className={styles.eiFilterDropdownItem}>
                            {isMulti ?
                                <section className={styles.eiFilterCustomCheckbox}>
                                    <input readOnly
                                           aria-label={"select all"}
                                           tabIndex={-1}
                                           className={(selectedOptionsCount === options.length - 1) ?
                                               styles.eiFilterSelectedAllOption : ''} // options.length - 1 is to remove Select All option from evaluation
                                           type="checkbox"
                                           checked={isSelected(option) ||
                                               (option.value === selectAllString && selectedOptionsCount === options.length - 1)}
                                    />
                                    <label className={styles.eiFilterCustomCheckboxLabel}>{option.label}</label>
                                </section>
                                :
                                <section className={styles.eiFilterCustomSelect}>
                                    <label>{option.label}</label>
                                    {isSelected(option) && <CheckIcon/>}
                                </section>
                            }
                        </div>
                        }

                        {option.value !== selectAllString && <div
                            role={"menuitem"}
                            key={option.value}
                            onClick={() => {
                                onOptionClick(option);
                                if (!isMulti) {
                                }
                            }}
                            className={styles.eiFilterDropdownItem}>
                            {isMulti ?
                                <section className={styles.eiFilterCustomCheckbox}>
                                    <input readOnly
                                           aria-label={option.label}
                                           tabIndex={-1}
                                           type="checkbox"
                                           checked={isSelected(option)}
                                    />
                                    <label className={styles.eiFilterCustomCheckboxLabel}>{option.label}</label>
                                </section>
                                :
                                <section className={styles.eiFilterCustomSelect}>
                                    <label>{option.label}</label>
                                    {isSelected(option) && <CheckIcon/>}
                                </section>
                            }
                        </div>}
                    </>

                )}
            /> : <div className={styles.noResultsFound}>No results found</div>}
        </div>
    )
}