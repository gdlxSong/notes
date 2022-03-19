---
title: 同步执行产生的一个有趣问题
sidebar_position: 39
---


```go
	// dispatch event.
	if err = m.dispatcher.Dispatch(ctx, &v1.ProtoEvent{
		Id:        util.IG().EvID(),
		Timestamp: time.Now().UnixNano(),
		Callback:  m.callbackAddr(),
		Metadata: map[string]string{
			v1.MetaType:      sysET,
			v1.MetaRequestID: reqID,
			v1.MetaEntityID:  en.ID},
		Data: &v1.ProtoEvent_SystemData{
			SystemData: &v1.SystemData{
				Operator: string(v1.OpCreate),
				Data:     bytes,
			}},
	}); nil != err {
		log.Error("create entity, dispatch event",
			zap.Error(err), zfield.Eid(en.ID), zfield.ReqID(reqID))
		return nil, errors.Wrap(err, "create entity, dispatch event")
	}

	log.Debug("holding request, wait response",
		zfield.Eid(en.ID), zfield.ReqID(reqID))

	// hold request, wait response.
	resp := m.holder.Wait(ctx, reqID)
	if resp.Status != types.StatusOK {
		log.Error("create entity", zfield.Eid(en.ID), zfield.ReqID(reqID),
			zap.Error(xerrors.New(resp.ErrCode)), zfield.Base(en.JSON()))
		return nil, xerrors.New(resp.ErrCode)
	}

	log.Info("processing completed", zfield.Eid(en.ID),
		zfield.ReqID(reqID), zfield.Elapsed(elapsedTime.Elapsed()))
```


在上面的代码片段中， dispatch 将 event 发到 Queue(kafka) 中，然后被运行时消费异步执行，然后回调，holder.Wait 等待回调结果，然而 回调在 holder.Wait 就绪之前返回了！


