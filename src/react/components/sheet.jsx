import React, { forwardRef, useRef, useImperativeHandle } from 'react';
import { useIsomorphicLayoutEffect } from '../shared/use-isomorphic-layout-effect';
import { classNames, getExtraAttrs, emit, getSlots } from '../shared/utils';
import { colorClasses } from '../shared/mixins';
import { f7ready, f7 } from '../shared/f7';
import { watchProp } from '../shared/watch-prop';
import { modalStateClasses } from '../shared/modal-state-classes';

/* dts-imports
import { Sheet } from 'framework7/types';
*/

/* dts-props
  id?: string | number;
  className?: string;
  style?: React.CSSProperties;
  opened? : boolean
  animate? : boolean
  top? : boolean
  bottom? : boolean
  position? : string
  backdrop? : boolean
  backdropEl? : string | object
  closeByBackdropClick? : boolean
  closeByOutsideClick? : boolean
  closeOnEscape? : boolean
  push? : boolean
  swipeToClose? : boolean
  swipeToStep? : boolean
  swipeHandler? : string | object
  containerEl? : string | object
  COLOR_PROPS
  onSheetStepProgress? : (instance?: Sheet.Sheet, progress?: any) => void
  onSheetStepOpen? : (instance?: Sheet.Sheet) => void
  onSheetStepClose? : (instance?: Sheet.Sheet) => void
  onSheetOpen? : (instance?: Sheet.Sheet) => void
  onSheetOpened? : (instance?: Sheet.Sheet) => void
  onSheetClose? : (instance?: Sheet.Sheet) => void
  onSheetClosed? : (instance?: Sheet.Sheet) => void
  ref?: React.MutableRefObject<{el: HTMLElement | null; f7Sheet: () => Sheet.Sheet;}>;
*/

const Sheet = forwardRef((props, ref) => {
  const f7Sheet = useRef(null);
  const {
    className,
    id,
    style,
    top,
    bottom,
    position,
    push,
    opened,
    animate,
    backdrop,
    backdropEl,
    closeByBackdropClick,
    closeByOutsideClick,
    closeOnEscape,
    swipeToClose,
    swipeToStep,
    swipeHandler,
    containerEl,
  } = props;
  const extraAttrs = getExtraAttrs(props);

  const elRef = useRef(null);
  const isOpened = useRef(opened);
  const isClosing = useRef(false);

  const onStepProgress = (instance, progress) => {
    emit(props, 'sheetStepProgress', instance, progress);
  };
  const onStepOpen = (instance) => {
    emit(props, 'sheetStepOpen', instance);
  };
  const onStepClose = (instance) => {
    emit(props, 'sheetStepClose', instance);
  };
  const onOpen = (instance) => {
    isOpened.current = true;
    isClosing.current = false;
    emit(props, 'sheetOpen', instance);
  };
  const onOpened = (instance) => {
    emit(props, 'sheetOpened', instance);
  };
  const onClose = (instance) => {
    isOpened.current = false;
    isClosing.current = true;
    emit(props, 'sheetClose', instance);
  };
  const onClosed = (instance) => {
    isClosing.current = false;
    emit(props, 'sheetClosed', instance);
  };

  useImperativeHandle(ref, () => ({
    el: elRef.current,
    f7Sheet: () => f7Sheet.current,
  }));

  const onMount = () => {
    if (!elRef.current) return;
    const sheetParams = {
      el: elRef.current,
      on: {
        open: onOpen,
        opened: onOpened,
        close: onClose,
        closed: onClosed,
        stepOpen: onStepOpen,
        stepClose: onStepClose,
        stepProgress: onStepProgress,
      },
    };

    if ('animate' in props && typeof animate !== 'undefined') sheetParams.animate = animate;
    if ('backdrop' in props && typeof backdrop !== 'undefined') sheetParams.backdrop = backdrop;
    if ('backdropEl' in props) sheetParams.backdropEl = backdropEl;
    if ('closeByBackdropClick' in props) sheetParams.closeByBackdropClick = closeByBackdropClick;
    if ('closeByOutsideClick' in props) sheetParams.closeByOutsideClick = closeByOutsideClick;
    if ('closeOnEscape' in props) sheetParams.closeOnEscape = closeOnEscape;
    if ('swipeToClose' in props) sheetParams.swipeToClose = swipeToClose;
    if ('swipeToStep' in props) sheetParams.swipeToStep = swipeToStep;
    if ('swipeHandler' in props) sheetParams.swipeHandler = swipeHandler;
    if ('containerEl' in props) sheetParams.containerEl = containerEl;

    f7ready(() => {
      f7Sheet.current = f7.sheet.create(sheetParams);
      if (opened) {
        f7Sheet.current.open(false);
      }
    });
  };

  const onDestroy = () => {
    if (f7Sheet.current) {
      f7Sheet.current.destroy();
    }
    f7Sheet.current = null;
  };

  useIsomorphicLayoutEffect(() => {
    onMount();
    return onDestroy;
  }, []);

  watchProp(opened, (value) => {
    if (!f7Sheet.current) return;
    if (value) {
      f7Sheet.current.open();
    } else {
      f7Sheet.current.close();
    }
  });

  const slots = getSlots(props);
  const fixedList = [];
  const staticList = [];
  const fixedTags = 'navbar toolbar tabbar subnavbar searchbar messagebar fab list-index panel'
    .split(' ')
    .map((tagName) => `f7-${tagName}`);

  const slotsDefault = slots.default;

  if (slotsDefault && slotsDefault.length) {
    slotsDefault.forEach((child) => {
      if (typeof child === 'undefined') return;
      let isFixedTag = false;
      const tag = child.type && (child.type.displayName || child.type.name);
      if (!tag) {
        staticList.push(child);
        return;
      }
      if (fixedTags.indexOf(tag) >= 0) {
        isFixedTag = true;
      }

      if (isFixedTag) fixedList.push(child);
      else staticList.push(child);
    });
  }
  const innerEl = (
    <div className="sheet-modal-inner">
      {staticList}
      {slots.static}
    </div>
  );

  let positionComputed = 'bottom';
  if (position) positionComputed = position;
  else if (top) positionComputed = 'top';
  else if (bottom) positionComputed = 'bottom';

  const classes = classNames(
    className,
    'sheet-modal',
    `sheet-modal-${positionComputed}`,
    {
      'sheet-modal-push': push,
    },
    modalStateClasses({ isOpened, isClosing }),
    colorClasses(props),
  );

  return (
    <div id={id} style={style} className={classes} ref={elRef} {...extraAttrs}>
      {fixedList}
      {slots.fixed}
      {innerEl}
    </div>
  );
});

Sheet.displayName = 'f7-sheet';

export default Sheet;
